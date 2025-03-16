// lib/profileService.ts
import { supabase } from '@/utils/supabase';

// Profile cache to prevent repeated fetches
const profileCache: Record<string, any> = {};

/**
 * Profile interface
 */
export interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string | null;
  email?: string;
  updated_at?: string;
  specialty?: string;
  status?: 'online' | 'busy' | 'offline';
  bio?: string;
  role?: 'user' | 'doctor' | 'admin';
  created_at?: string;
}

/**
 * Default profile values when a profile is not found
 */
const DEFAULT_PROFILE: Profile = {
  id: 'unknown',
  full_name: 'User',
  avatar_url: null,
  status: 'offline',
  role: 'user'
};

/**
 * Get a user profile by ID with caching
 */
export const getProfile = async (userId: string): Promise<Profile> => {
  try {
    // Check cache first
    if (profileCache[userId]) {
      console.log(`Using cached profile for user ID: ${userId}`);
      return profileCache[userId];
    }
    
    console.log(`Fetching profile for user ID: ${userId}`);
    
    if (!userId) {
      console.warn('No user ID provided to getProfile');
      return { ...DEFAULT_PROFILE, id: userId || 'unknown' };
    }
    
    // Query the profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return { ...DEFAULT_PROFILE, id: userId };
    }
    
    if (!data) {
      console.log(`No profile found for user ID: ${userId}`);
      // Create a default profile object with the user ID
      const defaultProfile = { ...DEFAULT_PROFILE, id: userId };
      profileCache[userId] = defaultProfile;
      return defaultProfile;
    }
    
    // Cache the profile for future use
    profileCache[userId] = data;
    return data;
  } catch (err) {
    console.error('Unexpected error in getProfile:', err);
    return { ...DEFAULT_PROFILE, id: userId };
  }
};

/**
 * Update or create a user profile
 */
export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
      .select()
      .single();
    
    if (error) {
      console.error('Error updating profile:', error);
      return null;
    }
    
    // Update the cache
    profileCache[userId] = data;
    return data;
  } catch (err) {
    console.error('Unexpected error in updateProfile:', err);
    return null;
  }
};

/**
 * Clear the profile cache for specific user or all users
 */
export const clearProfileCache = (userId?: string): void => {
  if (userId) {
    delete profileCache[userId];
  } else {
    // Clear all profiles from cache
    Object.keys(profileCache).forEach(key => {
      delete profileCache[key];
    });
  }
};

export default {
  getProfile,
  updateProfile,
  clearProfileCache
};