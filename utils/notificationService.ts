// utils/notificationService.ts
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Sound objects
let messageSentSound: Audio.Sound | null = null;
let messageReceivedSound: Audio.Sound | null = null;

// Message badge count
let unreadMessageCount = 0;

/**
 * Initialize sounds and notifications for the app
 */
export const initSounds = async (): Promise<void> => {
  try {
    // Configure notifications
    await configureNotifications();
    
    // Load sound files
    const sentSoundModule = require('../assets/sounds/message-sent.wav');
    const receivedSoundModule = require('../assets/sounds/message-received.wav');
    
    // Create sound objects
    const { sound: sentSound } = await Audio.Sound.createAsync(sentSoundModule);
    const { sound: receivedSound } = await Audio.Sound.createAsync(receivedSoundModule);
    
    // Store sound objects
    messageSentSound = sentSound;
    messageReceivedSound = receivedSound;
    
    console.log('Sounds initialized successfully');
  } catch (error) {
    console.error('Error initializing sounds:', error);
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
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  
  // Setup notification received listener
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });
  
  // Setup notification response listener
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification response received:', response);
    // You can handle navigation here, but it's better to do it in the component
  });
  
  return true;
};

/**
 * Play the message sent sound
 */
export const playMessageSentSound = async (): Promise<void> => {
  try {
    if (messageSentSound) {
      await messageSentSound.replayAsync();
    } else {
      console.warn('Message sent sound not initialized');
    }
  } catch (error) {
    console.error('Error playing message sent sound:', error);
  }
};

/**
 * Play the message received sound
 */
export const playMessageReceivedSound = async (): Promise<void> => {
  try {
    if (messageReceivedSound) {
      await messageReceivedSound.replayAsync();
    } else {
      console.warn('Message received sound not initialized');
    }
  } catch (error) {
    console.error('Error playing message received sound:', error);
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
        sound: true,
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

export default {
  initSounds,
  configureNotifications,
  playMessageSentSound,
  playMessageReceivedSound,
  showNotification,
  showMessageNotification,
  clearUnreadMessageCount,
  incrementUnreadMessageCount,
  setUnreadMessageCount,
  getUnreadMessageCount,
  clearAllNotifications
};