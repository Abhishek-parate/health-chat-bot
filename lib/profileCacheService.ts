import { getProfileWithCache } from '@/utils/profileCacheService';

// Use this instead of direct ProfileService calls
const profile = await getProfileWithCache(userId);