import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  emailVerified: boolean;
  provider: string;
  providers: string[];
  plan: string;
  totalCredits: number;
  creditsExpiryDate: any;
  theme: string;
  mode: string;
  company: string;
  totalVideos: number;
  totalClips: number;
  storageUsed: number;
  notifications: {
    processing: boolean;
    weekly: boolean;
    marketing: boolean;
  };
  createdAt: any;
  lastLogin: any;
}

const CACHE_KEY_PREFIX = 'user_profile_';
const SESSION_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Aggressive caching hook for user profile
 *
 * Strategy:
 * 1. Check sessionStorage first (instant)
 * 2. Check React Query cache (instant)
 * 3. Fetch from Firestore only if both miss (one time per session)
 * 4. Cache for entire session
 *
 * NO real-time listeners - profile data rarely changes
 */
export function useUserProfile() {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;

  const query = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!userId) return null;

      // Try sessionStorage first (instant, no API call)
      try {
        const cached = sessionStorage.getItem(`${CACHE_KEY_PREFIX}${userId}`);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < SESSION_CACHE_TTL) {
            return data as UserProfile;
          }
        }
      } catch (error) {
        console.error('Failed to read cached profile:', error);
      }

      // Only fetch from Firestore if cache miss
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        return null;
      }

      const data = userDocSnap.data() as UserProfile;

      // Convert Firestore Timestamps to ISO strings for caching
      const cacheData = {
        ...data,
        creditsExpiryDate: data.creditsExpiryDate?.toDate?.()
          ? data.creditsExpiryDate.toDate().toISOString()
          : data.creditsExpiryDate,
        createdAt: data.createdAt?.toDate?.()
          ? data.createdAt.toDate().toISOString()
          : data.createdAt,
        lastLogin: data.lastLogin?.toDate?.()
          ? data.lastLogin.toDate().toISOString()
          : data.lastLogin,
      };

      // Cache in sessionStorage
      try {
        sessionStorage.setItem(
          `${CACHE_KEY_PREFIX}${userId}`,
          JSON.stringify({
            data: cacheData,
            timestamp: Date.now()
          })
        );
      } catch (error) {
        console.error('Failed to cache user profile:', error);
      }

      return data;
    },
    enabled: !!userId,
    staleTime: Infinity, // Never consider data stale
    gcTime: Infinity, // Keep in cache forever (until browser close)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  return query;
}

/**
 * Hook to get specific user plan data
 */
export function useUserPlan() {
  const { data: profile, ...rest } = useUserProfile();

  return {
    ...rest,
    plan: profile?.plan || 'Free',
    totalCredits: profile?.totalCredits || 60,
    creditsExpiryDate: profile?.creditsExpiryDate,
  };
}

/**
 * Hook to get user theme preferences
 */
export function useUserTheme() {
  const { data: profile, ...rest } = useUserProfile();

  return {
    ...rest,
    theme: profile?.theme || 'indigo',
    mode: profile?.mode || 'light',
  };
}

/**
 * Clear user profile cache (call on logout)
 */
export function clearUserProfileCache(userId: string) {
  try {
    sessionStorage.removeItem(`${CACHE_KEY_PREFIX}${userId}`);
  } catch (error) {
    console.error('Failed to clear profile cache:', error);
  }
}

/**
 * Force refresh profile from server (call after profile update)
 */
export async function refreshUserProfile(userId: string) {
  try {
    sessionStorage.removeItem(`${CACHE_KEY_PREFIX}${userId}`);
  } catch (error) {
    console.error('Failed to clear profile cache:', error);
  }
}
