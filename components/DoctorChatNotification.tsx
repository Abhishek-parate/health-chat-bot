// components/DoctorChatNotification.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { 
  playSimpleSound, 
  showMessageNotification,
  incrementUnreadMessageCount
} from '@/utils/notificationService';
import { Vibration } from 'react-native';

interface DoctorChatNotificationProps {
  children: React.ReactNode;
}

// Safe wrapper for playing notification sounds
const playNotificationSound = async () => {
  try {
    // Use simple sound method directly, skipping the complex one
    await playSimpleSound(false);
  } catch (error) {
    console.error('Failed to play notification sound:', error);
    // Fallback to vibration
    Vibration.vibrate(300);
  }
};

const DoctorChatNotification: React.FC<DoctorChatNotificationProps> = ({ children }) => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Set up notification subscription when doctor logs in
  useEffect(() => {
    if (!user) return;

    // Avoid duplicate subscriptions
    if (isSubscribed) return;

    // Subscribe to messages sent by patients to this doctor
    const setupSubscription = async () => {
      try {
        // Get all conversations where the user is a doctor
        const { data: conversations, error } = await supabase
          .from('conversations')
          .select('id, user_id')
          .eq('doctor_id', user.id);
        
        if (error) {
          console.error('Error fetching doctor conversations:', error);
          return;
        }
        
        if (!conversations || conversations.length === 0) {
          console.log('No conversations found for doctor');
          return;
        }
        
        const conversationIds = conversations.map(c => c.id);
        // Create a map of conversation ID to patient ID for quick lookup
        const patientMap = conversations.reduce((map, convo) => {
          map[convo.id] = convo.user_id;
          return map;
        }, {});
        
        console.log(`Setting up message notifications for ${conversationIds.length} conversations`);
        
        // Subscribe to new messages in the doctor's conversations
        const subscription = supabase
          .channel('doctor-message-notifications')
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `role=eq.user`, // Filter for messages from patients
          }, async (payload) => {
            try {
              // Check if this message is in one of the doctor's conversations
              const messageConvoId = payload.new.conversation_id;
              if (conversationIds.includes(messageConvoId)) {
                console.log('New message received for doctor in conversation:', messageConvoId);
                
                // Use simplified sound method that should work reliably
                playNotificationSound();
                
                // Increment unread message count
                incrementUnreadMessageCount();
                
                // Get patient name for the notification
                let patientName = 'Patient';
                
                // Look up patient ID from our map
                const patientId = patientMap[messageConvoId];
                
                if (patientId) {
                  // Get patient profile
                  const { data: patientProfile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('id', patientId)
                    .single();
                    
                  if (patientProfile) {
                    patientName = patientProfile.full_name || 'Patient';
                  }
                }
                
                // Show a notification
                showMessageNotification(
                  patientName,
                  payload.new.content,
                  messageConvoId,
                  true // from a doctor perspective
                );
              }
            } catch (error) {
              console.error('Error handling patient message:', error);
              // Try to notify with vibration if all else fails
              Vibration.vibrate(300);
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
        console.error('Error setting up doctor notification subscription:', error);
      }
    };
    
    setupSubscription();
  }, [user, isSubscribed]);

  // This is a wrapper component, just render children
  return <>{children}</>;
};

export default DoctorChatNotification;