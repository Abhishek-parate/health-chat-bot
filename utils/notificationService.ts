// utils/notificationService.ts
import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';
import { AVPlaybackSource } from 'expo-av/build/AV.types';

// Sound objects
let messageSentSound: Audio.Sound | null = null;
let messageReceivedSound: Audio.Sound | null = null;

/**
 * Initialize sounds for the app
 */
export const initSounds = async (): Promise<void> => {
  try {
    // Configure notifications
    await configureNotifications();
    
    // Load sound files
    const sentSoundModule: AVPlaybackSource = require('../assets/sounds/message-sent.wav');
    const receivedSoundModule: AVPlaybackSource = require('../assets/sounds/message-received.wav');
    
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
const configureNotifications = async (): Promise<void> => {
  // Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Notification permission not granted');
    return;
  }
  
  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
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
 * Clear unread message count for a conversation
 */
export const clearUnreadMessageCount = async (conversationId: string | number): Promise<void> => {
  // Implementation will depend on how you track unread counts
  console.log(`Clearing unread count for conversation: ${conversationId}`);
  // Add your implementation here
};