/**
 * Subscription Management Hooks
 * Uses TanStack React Query for server state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { httpsCallable } from 'firebase/functions';
import type { PlanName, BillingPeriod, Currency } from '@/lib/pricing';

export interface Subscription {
  id: string;
  razorpaySubscriptionId: string;
  razorpayPlanId: string;
  razorpayCustomerId: string;
  userId: string;
  planName: PlanName;
  billingPeriod: BillingPeriod;
  currency: Currency;
  amount: number;
  status: 'created' | 'authenticated' | 'active' | 'paused' | 'halted' | 'cancelled' | 'completed' | 'expired';
  totalCredits: number;
  creditsUsed: number;
  creditsRemaining: number;
  startedAt?: any;
  currentStart?: any;
  currentEnd?: any;
  nextBillingAt?: any;
  cancelledAt?: any;
  createdAt: any;
  updatedAt: any;
}

/**
 * Fetch active subscription for current user
 */
export function useActiveSubscription() {
  const { currentUser } = useAuth();

  return useQuery({
    queryKey: ['activeSubscription', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return null;

      const subscriptionsRef = collection(db, `users/${currentUser.uid}/subscriptions`);
      const q = query(
        subscriptionsRef,
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      } as Subscription;
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Fetch subscription history for current user
 */
export function useSubscriptionHistory() {
  const { currentUser } = useAuth();

  return useQuery({
    queryKey: ['subscriptionHistory', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return [];

      const subscriptionsRef = collection(db, `users/${currentUser.uid}/subscriptions`);
      const q = query(subscriptionsRef, orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Subscription[];
    },
    enabled: !!currentUser,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Create subscription mutation
 */
export function useCreateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      planName: PlanName;
      billingPeriod: BillingPeriod;
      currency: Currency;
    }) => {
      const createSubscription = httpsCallable(functions, 'createRazorpaySubscription');
      const result = await createSubscription(data);
      return result.data as {
        subscriptionId: string;
        planId: string;
        status: string;
        shortUrl: string;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (error: any) => {
      console.error('Create subscription error:', error);
    },
  });
}

/**
 * Verify payment mutation
 */
export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      razorpayPaymentId: string;
      razorpaySubscriptionId: string;
      razorpaySignature: string;
    }) => {
      const verifyPayment = httpsCallable(functions, 'verifyRazorpayPayment');
      const result = await verifyPayment(data);
      return result.data as {
        success: boolean;
        status: string;
        message: string;
      };
    },
    onSuccess: () => {
      // Invalidate all relevant queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['activeSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });

      // Clear user profile cache in sessionStorage
      const currentUser = queryClient.getQueryData(['auth', 'currentUser']) as any;
      if (currentUser?.uid) {
        try {
          sessionStorage.removeItem(`user_profile_${currentUser.uid}`);
        } catch (error) {
          console.error('Failed to clear profile cache:', error);
        }
      }
    },
    onError: (error: any) => {
      console.error('Verify payment error:', error);
    },
  });
}

/**
 * Cancel subscription mutation
 */
export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      subscriptionId: string;
      cancelAtCycleEnd: boolean;
    }) => {
      const cancelSubscription = httpsCallable(functions, 'cancelRazorpaySubscription');
      const result = await cancelSubscription(data);
      return result.data as {
        success: boolean;
        message: string;
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });

      // Clear user profile cache
      const currentUser = queryClient.getQueryData(['auth', 'currentUser']) as any;
      if (currentUser?.uid) {
        try {
          sessionStorage.removeItem(`user_profile_${currentUser.uid}`);
        } catch (error) {
          console.error('Failed to clear profile cache:', error);
        }
      }
    },
    onError: (error: any) => {
      console.error('Cancel subscription error:', error);
    },
  });
}

/**
 * Track video usage mutation
 */
export function useTrackVideoUsage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      videoId: string;
      sessionId: string;
      durationSeconds: number;
    }) => {
      const trackUsage = httpsCallable(functions, 'trackVideoUsage');
      const result = await trackUsage(data);
      return result.data as {
        success: boolean;
        creditsUsed: number;
        creditsRemaining: number;
      };
    },
    onSuccess: () => {
      // Clear user profile cache first
      const currentUser = queryClient.getQueryData(['auth', 'currentUser']) as any;
      if (currentUser?.uid) {
        try {
          sessionStorage.removeItem(`user_profile_${currentUser.uid}`);
        } catch (error) {
          console.error('Failed to clear profile cache:', error);
        }
      }

      // Invalidate and refetch immediately
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.refetchQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['activeSubscription'] });

      console.log('[useTrackVideoUsage] ✓ Cache cleared and profile refetched');
    },
    onError: (error: any) => {
      console.error('Track video usage error:', error);
    },
  });
}

/**
 * UTILITY: Mark all existing videos as tracked (one-time migration)
 */
export function useMarkAllVideosAsTracked() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        const markVideos = httpsCallable(functions, 'markAllVideosAsTracked');
        const result = await markVideos({});
        console.log('[useMarkAllVideosAsTracked] Raw result:', result);
        return result.data as {
          success: boolean;
          markedCount: number;
          alreadyMarkedCount: number;
          totalVideos: number;
        };
      } catch (error: any) {
        console.error('[useMarkAllVideosAsTracked] Function call error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('[useMarkAllVideosAsTracked] ✓ Videos marked:', data);
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (error: any) => {
      console.error('[useMarkAllVideosAsTracked] Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        full: error,
      });
    },
  });
}

/**
 * UTILITY: Reset credits to zero (for testing)
 */
export function useResetCreditsForTesting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        const resetCredits = httpsCallable(functions, 'resetCreditsForTesting');
        const result = await resetCredits({});
        console.log('[useResetCreditsForTesting] Raw result:', result);
        return result.data as {
          success: boolean;
          message: string;
        };
      } catch (error: any) {
        console.error('[useResetCreditsForTesting] Function call error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('[useResetCreditsForTesting] ✓ Credits reset:', data);

      // Clear cache and force refetch
      const currentUser = queryClient.getQueryData(['auth', 'currentUser']) as any;
      if (currentUser?.uid) {
        try {
          sessionStorage.removeItem(`user_profile_${currentUser.uid}`);
        } catch (error) {
          console.error('Failed to clear profile cache:', error);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.refetchQueries({ queryKey: ['userProfile'] });
    },
    onError: (error: any) => {
      console.error('[useResetCreditsForTesting] Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        full: error,
      });
    },
  });
}
