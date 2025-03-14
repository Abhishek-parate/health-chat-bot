// utils/storage.ts
// Simple storage utilities using async storage or localStorage for web

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  SETTINGS: 'app_settings',
};

// User data storage
export async function saveUserData(userData: any): Promise<void> {
  try {
    const jsonValue = JSON.stringify(userData);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, jsonValue);
  } catch (error) {
    console.error('Error saving user data:', error);
  }
}

export async function getUserData(): Promise<any | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

export async function clearUserData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
}

// Auth token storage
export async function saveAuthToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
}

export async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

export async function clearAuthToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error clearing auth token:', error);
  }
}

// App settings storage
export async function saveSettings(settings: any): Promise<void> {
  try {
    const jsonValue = JSON.stringify(settings);
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, jsonValue);
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

export async function getSettings(): Promise<any | null> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error('Error getting settings:', error);
    return null;
  }
}