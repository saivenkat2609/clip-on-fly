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

  // Plan & Subscription
  plan: 'Free' | 'Starter' | 'Professional';
  subscriptionStatus?: 'none' | 'active' | 'authenticated' | 'cancelled' | 'expired' | 'paused' | 'halted';
  subscriptionId?: string;
  razorpayCustomerId?: string;
  preferredCurrency?: 'INR' | 'USD';

  // Credits & Usage
  totalCredits: number;
  creditsUsed?: number;
  creditsExpiryDate: any;

  // Plan Features
  maxVideoLength?: number;
  exportQuality?: '720p' | '1080p' | '4K';
  hasWatermark?: boolean;
  hasAIViralityScore?: boolean;
  hasCustomBranding?: boolean;
  hasSocialScheduler?: boolean;
  hasAITitleGeneration?: boolean;
  supportLevel?: 'community' | 'email' | 'priority';

  // User Preferences
  theme: string;
  mode: string;
  company: string;

  // Statistics
  totalVideos: number;
  totalClips: number;
  storageUsed: number;

  // Notifications
  notifications: {
    processing: boolean;
    weekly: boolean;
    marketing: boolean;
  };

  // Timestamps
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
    // HIGH PRIORITY FIX #18: Changed from Infinity to reasonable TTLs
    // This allows profile changes (plan upgrades, subscription changes) to reflect automatically
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh for 5 min, then refetches in background
    gcTime: 10 * 60 * 1000, // 10 minutes - cached data retained for 10 min after becoming unused
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
    totalCredits: profile?.totalCredits || 30,
    creditsUsed: profile?.creditsUsed || 0,
    creditsExpiryDate: profile?.creditsExpiryDate,
    subscriptionStatus: profile?.subscriptionStatus,
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
