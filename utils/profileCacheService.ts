// utils/profileCacheService.ts
import { ProfileService, Profile } from '@/lib/supabaseService';

// Create an in-memory cache for profiles
const profileCache: Record<string, Profile & { timestamp: number }> = {};
const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

// Default profile to use when no profile is found
const DEFAULT_PROFILE: Profile = {
  id: 'unknown',
  full_name: 'User',
  avatar_url: null,
  role: 'user',
  phone_verified: false,
  status: 'offline',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

/**
 * Get a user profile, using the cache when available
 */
export const getProfileWithCache = async (userId: string): Promise<Profile> => {
  if (!userId) {
    console.warn('No userId provided to getProfileWithCache');
    return { ...DEFAULT_PROFILE, id: 'unknown' };
  }
  
  try {
    // Check if we have a cached version that's still valid
    const cachedProfile = profileCache[userId];
    const now = Date.now();
    
    if (cachedProfile && (now - cachedProfile.timestamp) < CACHE_EXPIRY) {
      console.log(`Using cached profile for user ID: ${userId}`);
      const { timestamp, ...profile } = cachedProfile;
      return profile;
    }
    
    // No valid cached profile, fetch from database
    console.log(`Fetching profile for user ID: ${userId}`);
    const profile = await ProfileService.getProfile(userId);
    
    if (profile) {
      // Store in cache
      profileCache[userId] = { 
        ...profile, 
        timestamp: now 
      };
      return profile;
    }
    
    // No profile found, use default and cache it too
    console.log(`No profile found for user ID: ${userId}, using default`);
    const defaultProfile = { ...DEFAULT_PROFILE, id: userId };
    profileCache[userId] = { 
      ...defaultProfile, 
      timestamp: now 
    };
    return defaultProfile;
  } catch (error) {
    console.error('Error in getProfileWithCache:', error);
    
    // Return default profile on error
    const defaultProfile = { ...DEFAULT_PROFILE, id: userId };
    return defaultProfile;
  }
};

/**
 * Create or update a profile, and update the cache
 */
export const updateProfileWithCache = async (
  userId: string, 
  profileData: Partial<Profile>
): Promise<Profile | null> => {
  try {
    // Create a profile object with required fields
    const updates = {
      ...profileData,
      updated_at: new Date().toISOString()
    };
    
    // First, try to get the existing profile
    const existingProfile = await ProfileService.getProfile(userId);
    
    // Create the profile if it doesn't exist
    if (!existingProfile) {
      // We need to create a new profile
      const newProfile: Partial<Profile> = {
        id: userId,
        full_name: profileData.full_name || 'User',
        avatar_url: profileData.avatar_url || null,
        role: profileData.role || 'user',
        phone_verified: profileData.phone_verified || false,
        status: profileData.status || 'offline',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...profileData
      };
      
      // Save to the database
      await createUserProfile(userId, newProfile);
      
      // Update cache
      profileCache[userId] = { 
        ...(newProfile as Profile), 
        timestamp: Date.now() 
      };
      
      return newProfile as Profile;
    }
    
    // Update the existing profile
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error updating profile:', error);
      return null;
    }
    
    // Update cache
    profileCache[userId] = { 
      ...(data as Profile), 
      timestamp: Date.now() 
    };
    
    return data as Profile;
  } catch (error) {
    console.error('Error in updateProfileWithCache:', error);
    return null;
  }
};

/**
 * Helper function to create a user profile
 */
async function createUserProfile(userId: string, userData: Partial<Profile>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        full_name: userData.full_name || '',
        avatar_url: userData.avatar_url || '',
        role: userData.role || 'user',
        phone_number: userData.phone_number || '',
        phone_verified: userData.phone_verified || false,
        status: 'offline'
      }]);

    if (error) {
      console.error('Error creating user profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception creating user profile:', error);
    return false;
  }
}

/**
 * Clear the profile cache
 */
export const clearProfileCache = (userId?: string): void => {
  if (userId) {
    delete profileCache[userId];
  } else {
    // Clear all profiles
    Object.keys(profileCache).forEach(key => {
      delete profileCache[key];
    });
  }
};

export default {
  getProfileWithCache,
  updateProfileWithCache,
  clearProfileCache
};