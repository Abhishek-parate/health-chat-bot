// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import * as Constants from 'expo-constants';

// Get the Supabase URL and anon key from environment variables or use defaults
const supabaseUrl = Constants?.expoConfig?.extra?.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = Constants?.expoConfig?.extra?.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Implement SecureStore adapter for Supabase persistence
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Function to initialize Supabase and set up any required data
export async function initializeSupabase() {
  try {
    // Check if connected
    const { error } = await supabase.from('health_conversations').select('id').limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error.message);
      return false;
    }
    
    console.log('Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Error initializing Supabase:', error);
    return false;
  }
}