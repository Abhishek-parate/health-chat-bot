// utils/notificationService.ts - Completely simplified without Audio API
import * as Notifications from 'expo-notifications';
import { Platform, Vibration } from 'react-native';

// Message badge count
let unreadMessageCount = 0;

/**
 * Initialize notifications for the app - NO SOUND INITIALIZATION
 */
export const initSounds = async (): Promise<void> => {
  try {
    // Just configure notifications, don't load sounds
    await configureNotifications();
    console.log('Notification system initialized successfully');
  } catch (error) {
    console.error('Error initializing notification system:', error);
  }
};

/**
 * Configure notification settings
 */
export const configureNotifications = async (): Promise<boolean> => {
  // Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Notification permission not granted');
    return false;
  }
  
  // Configure notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,  // This will use system sounds
      shouldSetBadge: true,
    }),
  });
  
  return true;
};

/**
 * Just vibrate the device - no sound playback attempt
 */
export const playMessageSentSound = async (): Promise<void> => {
  // Just use vibration instead of attempting to play sounds
  Vibration.vibrate(80);
};

/**
 * Just vibrate the device - no sound playback attempt
 */
export const playMessageReceivedSound = async (): Promise<void> => {
  // Longer vibration pattern for received messages
  Vibration.vibrate([0, 80, 100, 80]);
};

/**
 * Simplified version that just vibrates without any audio API calls
 */
export const playSimpleSound = async (isMessageSent = true): Promise<void> => {
  if (isMessageSent) {
    Vibration.vibrate(80);
  } else {
    Vibration.vibrate([0, 80, 100, 80]);
  }
};

/**
 * Show a local notification
 */
export const showNotification = async (
  title: string, 
  body: string, 
  data?: any
): Promise<string> => {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,  // Use system default sound
      },
      trigger: null, // Show immediately
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error showing notification:', error);
    return '';
  }
};

/**
 * Show a notification for a new message
 */
export const showMessageNotification = async (
  senderName: string,
  message: string,
  conversationId: string,
  isDoctor: boolean = false
): Promise<string> => {
  const title = `New message from ${senderName}`;
  const body = message;
  
  // Always vibrate when showing notifications
  playSimpleSound(!isDoctor);
  
  return showNotification(title, body, {
    conversationId,
    isDoctor
  });
};

/**
 * Clear unread message count for a conversation
 */
export const clearUnreadMessageCount = async (conversationId: string | number): Promise<void> => {
  // Implementation will depend on how you track unread counts
  console.log(`Clearing unread count for conversation: ${conversationId}`);
  
  try {
    // For handling multiple conversations, this implementation just decrements the count
    // In a real app, you might want to store per-conversation counts in a database or storage
    unreadMessageCount = Math.max(0, unreadMessageCount - 1);
    
    // Update app badge count
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await Notifications.setBadgeCountAsync(unreadMessageCount);
    }
  } catch (error) {
    console.error('Error clearing unread message count:', error);
  }
};

/**
 * Increment unread message count
 */
export const incrementUnreadMessageCount = async (): Promise<void> => {
  try {
    // Increment local counter
    unreadMessageCount += 1;
    
    // Update app badge count
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await Notifications.setBadgeCountAsync(unreadMessageCount);
    }
  } catch (error) {
    console.error('Error incrementing unread message count:', error);
  }
};

/**
 * Set total unread message count
 */
export const setUnreadMessageCount = async (count: number): Promise<void> => {
  try {
    // Set local counter
    unreadMessageCount = count;
    
    // Update app badge count
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await Notifications.setBadgeCountAsync(count);
    }
  } catch (error) {
    console.error('Error setting unread message count:', error);
  }
};

/**
 * Get current unread message count
 */
export const getUnreadMessageCount = (): number => {
  return unreadMessageCount;
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.dismissAllNotificationsAsync();
    
    // Reset badge count
    unreadMessageCount = 0;
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      await Notifications.setBadgeCountAsync(0);
    }
  } catch (error) {
    console.error('Error clearing all notifications:', error);
  }
};

// Cleanup on app exit
export const cleanupSounds = async () => {
  // Nothing to clean up since we're not using Audio API
  console.log('No sounds to clean up');
};

export default {
  initSounds,
  configureNotifications,
  playMessageSentSound,
  playMessageReceivedSound,
  playSimpleSound,
  showNotification,
  showMessageNotification,
  clearUnreadMessageCount,
  incrementUnreadMessageCount,
  setUnreadMessageCount,
  getUnreadMessageCount,
  clearAllNotifications,
  cleanupSounds
};