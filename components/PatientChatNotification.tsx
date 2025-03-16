// components/PatientChatNotification.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { 
  playMessageReceivedSound, 
  showMessageNotification,
  incrementUnreadMessageCount
} from '@/utils/notificationService';

interface PatientChatNotificationProps {
  children: React.ReactNode;
}

const PatientChatNotification: React.FC<PatientChatNotificationProps> = ({ children }) => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Set up notification subscription when user logs in
  useEffect(() => {
    if (!user) return;

    // Avoid duplicate subscriptions
    if (isSubscribed) return;

    // Subscribe to messages sent by doctors to this patient
    const setupSubscription = async () => {
      try {
        // Get all conversations where the user is a patient
        const { data: conversations, error } = await supabase
          .from('conversations')
          .select('id')
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error fetching patient conversations:', error);
          return;
        }
        
        if (!conversations || conversations.length === 0) {
          console.log('No conversations found for patient');
          return;
        }
        
        const conversationIds = conversations.map(c => c.id);
        console.log(`Setting up message notifications for ${conversationIds.length} conversations`);
        
        // Subscribe to new messages in the patient's conversations
        const subscription = supabase
          .channel('patient-message-notifications')
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `role=eq.doctor`, // Filter for messages from doctors
          }, async (payload) => {
            try {
              // Check if this message is in one of the patient's conversations
              const messageConvoId = payload.new.conversation_id;
              if (conversationIds.includes(messageConvoId)) {
                console.log('New message received from doctor in conversation:', messageConvoId);
                
                // Play sound for new message
                playMessageReceivedSound();
                
                // Increment unread message count
                incrementUnreadMessageCount();
                
                // Get doctor name for the notification (simplified)
                let doctorName = 'Your Doctor';
                
                // Get the conversation info to get doctor ID
                const { data: convo } = await supabase
                  .from('conversations')
                  .select('doctor_id')
                  .eq('id', messageConvoId)
                  .single();
                
                if (convo && convo.doctor_id) {
                  // Get doctor profile (simplified - direct query)
                  const { data: doctorProfile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', convo.doctor_id)
                    .single();
                    
                  if (doctorProfile) {
                    doctorName = `Dr. ${doctorProfile.full_name || 'Doctor'}`;
                  }
                }
                
                // Show a notification
                showMessageNotification(
                  doctorName,
                  payload.new.content,
                  messageConvoId,
                  false // not from a doctor perspective
                );
              }
            } catch (error) {
              console.error('Error handling doctor message:', error);
            }
          })
          .subscribe();
        
        setIsSubscribed(true);
        
        // Cleanup subscription
        return () => {
          supabase.removeChannel(subscription);
          setIsSubscribed(false);
        };
      } catch (error) {
        console.error('Error setting up patient notification subscription:', error);
      }
    };
    
    setupSubscription();
  }, [user, isSubscribed]);

  // This is a wrapper component, just render children
  return <>{children}</>;
};

export default PatientChatNotification;