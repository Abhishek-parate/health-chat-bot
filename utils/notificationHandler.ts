// utils/notificationHandler.ts
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { MessageService } from '@/lib/supabaseService';
import { clearUnreadMessageCount } from '@/utils/notificationService';
import { useAuth } from '@/contexts/AuthProvider';

/**
 * A hook that listens for notification responses and handles them appropriately
 * @param userId The current user's ID
 */
export function useNotificationHandler(userId: string | undefined) {
  const router = useRouter();
  const { userRole } = useAuth();

  useEffect(() => {
    if (!userId) return;
    
    // Set up notification listener
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      handleNotificationResponse(response, userId, router, userRole);
    });
    
    // Clean up the subscription
    return () => subscription.remove();
  }, [userId, router, userRole]);
}

/**
 * Handles the response when a user taps on a notification
 */
export async function handleNotificationResponse(
  response: Notifications.NotificationResponse, 
  userId: string,
  router: any,
  userRole: string
) {
  try {
    console.log('Notification response received');
    
    // Get the data from the notification
    const data = response.notification.request.content.data;
    const conversationId = data.conversationId;
    
    if (conversationId) {
      console.log(`Opening conversation: ${conversationId}`);
      
      // Mark messages as read in this conversation
      if (userId) {
        await MessageService.markMessagesAsRead(conversationId, userId);
        
        // Clear the unread count for this conversation
        await clearUnreadMessageCount(conversationId);
      }
      
      // Route to the appropriate interface based on user role
      if (userRole === 'doctor') {
        console.log('Routing to doctor chat interface');
        router.push({
          pathname: '/(doctor)/chat',
          params: { conversationId }
        });
      } else if (userRole === 'admin') {
        console.log('Routing to admin chat interface');
        router.push({
          pathname: '/(admin)/chat',
          params: { conversationId }
        });
      } else {
        // Default user interface
        console.log('Routing to user chat interface');
        router.push({
          pathname: '/chat',
          params: { id: conversationId }
        });
      }
    }
  } catch (error) {
    console.error('Error handling notification response:', error);
  }
}

// For direct use without the hook
export async function setupNotificationHandler() {
  // Configure how notifications are handled when the app is in the foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  
  // Request permissions
  const { status } = await Notifications.requestPermissionsAsync();
  
  return status === 'granted';
}