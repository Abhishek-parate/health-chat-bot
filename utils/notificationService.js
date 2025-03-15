// utils/notificationService.js - Simplified for Expo Go compatibility
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Placeholder sound functions for Expo Go
const playMessageReceivedSound = async () => {
  console.log('Message received sound would play here');
};

const playMessageSentSound = async () => {
  console.log('Message sent sound would play here');
};

// Initialize without actually loading sounds
const initSounds = async () => {
  console.log('Sound system would initialize here');
  return true;
};

// The message counter functions work normally in Expo Go
export const getUnreadMessageCount = async (conversationId) => {
  try {
    const unreadCountsStr = await AsyncStorage.getItem('unreadMessageCounts');
    const unreadCounts = unreadCountsStr ? JSON.parse(unreadCountsStr) : {};
    return unreadCounts[conversationId] || 0;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

export const incrementUnreadMessageCount = async (conversationId) => {
  try {
    const unreadCountsStr = await AsyncStorage.getItem('unreadMessageCounts');
    const unreadCounts = unreadCountsStr ? JSON.parse(unreadCountsStr) : {};
    
    unreadCounts[conversationId] = (unreadCounts[conversationId] || 0) + 1;
    await AsyncStorage.setItem('unreadMessageCounts', JSON.stringify(unreadCounts));
    
    return unreadCounts[conversationId];
  } catch (error) {
    console.error('Error incrementing unread count:', error);
    return 0;
  }
};

export const clearUnreadMessageCount = async (conversationId) => {
  try {
    const unreadCountsStr = await AsyncStorage.getItem('unreadMessageCounts');
    const unreadCounts = unreadCountsStr ? JSON.parse(unreadCountsStr) : {};
    
    unreadCounts[conversationId] = 0;
    await AsyncStorage.setItem('unreadMessageCounts', JSON.stringify(unreadCounts));
  } catch (error) {
    console.error('Error clearing unread count:', error);
  }
};

export const getTotalUnreadMessageCount = async () => {
  try {
    const unreadCountsStr = await AsyncStorage.getItem('unreadMessageCounts');
    const unreadCounts = unreadCountsStr ? JSON.parse(unreadCountsStr) : {};
    
    return Object.values(unreadCounts).reduce((total, count) => total + count, 0);
  } catch (error) {
    console.error('Error getting total unread count:', error);
    return 0;
  }
};

export { 
  playMessageReceivedSound, 
  playMessageSentSound, 
  initSounds 
};