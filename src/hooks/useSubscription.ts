/**
 * Subscription Management Hooks
 * Uses TanStack React Query for server state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db, functions } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
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
  status: 'active' | 'cancelled' | 'expired' | 'paused';
  currentStart: any;
  currentEnd: any;
  cancelledAt?: any;
  createdAt: any;
  updatedAt: any;
}

export interface Transaction {
  id: string;
  razorpayPaymentId: string;
  razorpaySubscriptionId: string;
  razorpayCustomerId: string;
  razorpayInvoiceId: string | null;
  userId: string;
  planName: PlanName;
  amount: number;
  currency: Currency;
  status: 'success' | 'failed' | 'pending';
  createdAt: any;
}

/**
 * Get active subscription for current user
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
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Create a new subscription mutation
 */
export function useCreateSubscription() {
  return useMutation({
    mutationFn: async (data: {
      planName: PlanName;
      billingPeriod: BillingPeriod;
      currency: Currency;
    }) => {
      const createSub = httpsCallable(functions, 'createRazorpaySubscription');
      const result = await createSub(data);
      return result.data as {
        subscriptionId: string;
        razorpayCustomerId: string;
      };
    },
    onError: (error) => {
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
      return result.data as { success: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error) => {
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
      const cancelSub = httpsCallable(functions, 'cancelRazorpaySubscription');
      const result = await cancelSub(data);
      return result.data as { success: boolean; message: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (error) => {
      console.error('Cancel subscription error:', error);
    },
  });
}

/**
 * Get transactions for current user
 */
export function useTransactions() {
  const { currentUser } = useAuth();

  return useQuery({
    queryKey: ['transactions', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return [];

      const transactionsRef = collection(db, `users/${currentUser.uid}/transactions`);
      const q = query(transactionsRef, orderBy('createdAt', 'desc'), limit(50));

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[];
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

/**
 * Fetch invoice PDF
 */
export function useFetchInvoice() {
  return useMutation({
    mutationFn: async (data: { invoiceId: string }) => {
      const fetchInvoice = httpsCallable(functions, 'fetchRazorpayInvoice');
      const result = await fetchInvoice(data);
      return result.data as { invoiceUrl: string };
    },
    onError: (error) => {
      console.error('Fetch invoice error:', error);
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
      queryClient.invalidateQueries({ queryKey: ['activeSubscription'] });

      console.log('[useTrackVideoUsage] Cache cleared and profile refetched successfully');
    },
    onError: (error) => {
      console.error('Track video usage error:', error);
    },
  });
}

export function useMarkAllVideosAsTracked() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      const userId = currentUser.uid;
      console.log('[useMarkAllVideosAsTracked] Starting for user:', userId);

      const videosRef = collection(db, `users/${userId}/videos`);
      const videosSnapshot = await getDocs(videosRef);

      let markedCount = 0;
      let alreadyMarkedCount = 0;

      const batch = writeBatch(db);

      videosSnapshot.docs.forEach((videoDoc) => {
        const videoData = videoDoc.data();

        if (!videoData.usageTracked) {
          batch.update(videoDoc.ref, {
            usageTracked: true,
            usageTrackedAt: serverTimestamp(),
          });
          markedCount++;
        } else {
          alreadyMarkedCount++;
        }
      });

      await batch.commit();

      console.log('[useMarkAllVideosAsTracked] Marked videos successfully:', markedCount, alreadyMarkedCount);

      return {
        success: true,
        markedCount,
        alreadyMarkedCount,
        totalVideos: videosSnapshot.size,
      };
    },
    onSuccess: (data) => {
      console.log('[useMarkAllVideosAsTracked] Videos marked successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (error) => {
      console.error('[useMarkAllVideosAsTracked] Error details:', error);
    },
  });
}

export function useResetCreditsForTesting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error('User must be authenticated');
      }

      const userId = currentUser.uid;
      console.log('[useResetCreditsForTesting] Resetting credits for user:', userId);

      const userRef = doc(db, `users/${userId}`);
      await updateDoc(userRef, {
        creditsUsed: 0,
      });

      console.log('[useResetCreditsForTesting] Credits reset to 0 successfully');

      return {
        success: true,
        message: 'Credits reset to 0',
      };
    },
    onSuccess: (data) => {
      console.log('[useResetCreditsForTesting] Credits reset successfully:', data);

      const auth = getAuth();
      const currentUser = auth.currentUser;
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
    onError: (error) => {
      console.error('[useResetCreditsForTesting] Error details:', error);
    },
  });
}
