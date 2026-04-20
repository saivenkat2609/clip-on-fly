import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  emailVerified: boolean;
  provider: string;
  providers: string[];
  plan: 'Free' | 'Starter' | 'Professional';
  subscriptionStatus?: 'none' | 'active' | 'authenticated' | 'cancelled' | 'expired' | 'paused' | 'halted';
  subscriptionId?: string;
  razorpayCustomerId?: string;
  preferredCurrency?: 'INR' | 'USD';
  totalCredits: number;
  creditsUsed?: number;
  creditsExpiryDate: any;
  maxVideoLength?: number;
  exportQuality?: '720p' | '1080p' | '4K';
  hasWatermark?: boolean;
  hasAIViralityScore?: boolean;
  hasCustomBranding?: boolean;
  hasSocialScheduler?: boolean;
  hasAITitleGeneration?: boolean;
  supportLevel?: 'community' | 'email' | 'priority';
  theme: string;
  mode: string;
  company: string;
  role?: 'user' | 'admin';
  totalVideos: number;
  totalClips: number;
  storageUsed: number;
  notifications: { processing: boolean; weekly: boolean; marketing: boolean };
  createdAt: any;
  lastLogin: any;
}

// Map Supabase snake_case columns → camelCase UserProfile shape the app expects
function mapRow(row: any): UserProfile {
  return {
    uid: row.id,
    email: row.email,
    displayName: row.display_name,
    photoURL: row.photo_url,
    emailVerified: row.email_verified,
    provider: row.provider,
    providers: row.providers,
    plan: row.plan,
    subscriptionStatus: row.subscription_status,
    subscriptionId: row.subscription_id,
    razorpayCustomerId: row.razorpay_customer_id,
    preferredCurrency: row.preferred_currency,
    totalCredits: row.total_credits,
    creditsUsed: row.credits_used,
    creditsExpiryDate: row.credits_expiry_date,
    maxVideoLength: row.max_video_length,
    exportQuality: row.export_quality,
    hasWatermark: row.has_watermark,
    hasAIViralityScore: row.has_ai_virality_score,
    hasCustomBranding: row.has_custom_branding,
    theme: row.theme,
    mode: row.mode,
    company: row.company,
    role: row.role,
    totalVideos: row.total_videos,
    totalClips: row.total_clips,
    storageUsed: row.storage_used,
    notifications: row.notifications,
    createdAt: row.created_at,
    lastLogin: row.last_login,
  };
}

const CACHE_KEY_PREFIX = 'user_profile_';
const SESSION_CACHE_TTL = 24 * 60 * 60 * 1000;

export function useUserProfile() {
  const { currentUser } = useAuth();
  const userId = currentUser?.uid;

  const query = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: async () => {
      if (!userId) return null;

      const skipCache = window.location.search.includes('payment=success') ||
                        sessionStorage.getItem('payment_just_completed') === 'true';

      if (!skipCache) {
        try {
          const cached = sessionStorage.getItem(`${CACHE_KEY_PREFIX}${userId}`);
          if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < SESSION_CACHE_TTL) return data as UserProfile;
          }
        } catch (error) {
          console.error('Failed to read cached profile:', error);
        }
      }

      if (skipCache) sessionStorage.removeItem('payment_just_completed');

      // Supabase: one line replaces doc() + getDoc()
      const { data: row, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !row) return null;

      const data = mapRow(row);

      try {
        sessionStorage.setItem(`${CACHE_KEY_PREFIX}${userId}`, JSON.stringify({ data, timestamp: Date.now() }));
      } catch (error) {
        console.error('Failed to cache user profile:', error);
      }

      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  return query;
}

// Delegates to React Query — same interface, no Realtime subscription needed
export function useUserProfileRealtime() {
  const { data, isLoading } = useUserProfile();
  return { data: data ?? null, isLoading };
}

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

export function useUserPlanRealtime() {
  const { data: profile, isLoading } = useUserProfileRealtime();
  return {
    isLoading,
    plan: profile?.plan || 'Free',
    totalCredits: profile?.totalCredits || 30,
    creditsUsed: profile?.creditsUsed || 0,
    creditsExpiryDate: profile?.creditsExpiryDate,
    subscriptionStatus: profile?.subscriptionStatus,
  };
}

export function useUserTheme() {
  const { data: profile, ...rest } = useUserProfile();
  return { ...rest, theme: profile?.theme || 'indigo', mode: profile?.mode || 'light' };
}

export function clearUserProfileCache(userId: string) {
  try { sessionStorage.removeItem(`${CACHE_KEY_PREFIX}${userId}`); } catch {}
}

export async function refreshUserProfile(userId: string) {
  try { sessionStorage.removeItem(`${CACHE_KEY_PREFIX}${userId}`); } catch {}
}
