import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
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

const API_BASE = import.meta.env.VITE_WORKERS_API_URL;

// Helper: call a Cloudflare Worker endpoint with Supabase auth token
async function callFunction(path: string, body: object) {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function mapSubscription(row: any): Subscription {
  return {
    id: row.id,
    razorpaySubscriptionId: row.razorpay_subscription_id,
    razorpayPlanId: row.razorpay_plan_id,
    razorpayCustomerId: row.razorpay_customer_id,
    userId: row.user_id,
    planName: row.plan_name,
    billingPeriod: row.billing_period,
    currency: row.currency,
    amount: row.amount,
    status: row.status,
    currentStart: row.current_start,
    currentEnd: row.current_end,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useActiveSubscription() {
  const { currentUser } = useAuth();

  return useQuery({
    queryKey: ['activeSubscription', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return null;

      // Replaces: query(subscriptionsRef, where('status','==','active'), orderBy('createdAt','desc'), limit(1))
      const { data: rows } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', currentUser.uid)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!rows?.length) return null;
      return mapSubscription(rows[0]);
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateSubscription() {
  return useMutation({
    mutationFn: async (data: { planName: PlanName; billingPeriod: BillingPeriod; currency: Currency }) => {
      // Replaces: httpsCallable(functions, 'createRazorpaySubscription')
      return callFunction('/payments/create', data) as Promise<{
        subscriptionId: string;
        razorpayCustomerId: string;
      }>;
    },
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      razorpayPaymentId: string;
      razorpaySubscriptionId: string;
      razorpaySignature: string;
    }) => {
      return callFunction('/payments/verify', data) as Promise<{ success: boolean }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { subscriptionId: string; cancelAtCycleEnd: boolean }) => {
      return callFunction('/payments/cancel', data) as Promise<{ success: boolean; message: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeSubscription'] });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
  });
}

export function useTransactions() {
  const { currentUser } = useAuth();

  return useQuery({
    queryKey: ['transactions', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return [];

      const { data: rows } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', currentUser.uid)
        .order('created_at', { ascending: false })
        .limit(50);

      return (rows ?? []).map((row): Transaction => ({
        id: row.id,
        razorpayPaymentId: row.razorpay_payment_id,
        razorpaySubscriptionId: row.razorpay_subscription_id,
        razorpayCustomerId: row.razorpay_customer_id,
        razorpayInvoiceId: row.razorpay_invoice_id,
        userId: row.user_id,
        planName: row.plan_name,
        amount: row.amount,
        currency: row.currency,
        status: row.status,
        createdAt: row.created_at,
      }));
    },
    enabled: !!currentUser,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useFetchInvoice() {
  return useMutation({
    mutationFn: async (data: { invoiceId: string }) => {
      return callFunction('/payments/invoice', data) as Promise<{ invoiceUrl: string }>;
    },
  });
}

export function useTrackVideoUsage() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async (data: { videoId: string; sessionId: string; durationSeconds: number }) => {
      return callFunction('/usage/track', data) as Promise<{
        success: boolean;
        creditsUsed: number;
        creditsRemaining: number;
      }>;
    },
    onSuccess: () => {
      if (currentUser?.uid) {
        try { sessionStorage.removeItem(`user_profile_${currentUser.uid}`); } catch {}
      }
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.refetchQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['activeSubscription'] });
    },
  });
}

export function useMarkAllVideosAsTracked() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error('User must be authenticated');

      // Replaces: writeBatch(db) — Supabase bulk update in one call
      const { data: videos } = await supabase
        .from('videos')
        .select('id, usage_tracked')
        .eq('user_id', currentUser.uid);

      const untracked = (videos ?? []).filter(v => !v.usage_tracked).map(v => v.id);

      if (untracked.length > 0) {
        await supabase
          .from('videos')
          .update({ usage_tracked: true, usage_tracked_at: new Date().toISOString() })
          .in('id', untracked);
      }

      return {
        success: true,
        markedCount: untracked.length,
        alreadyMarkedCount: (videos?.length ?? 0) - untracked.length,
        totalVideos: videos?.length ?? 0,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    },
  });
}

export function useResetCreditsForTesting() {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!currentUser) throw new Error('User must be authenticated');

      // Replaces: updateDoc(doc(db, 'users/${id}'), { creditsUsed: 0 })
      await supabase.from('users').update({ credits_used: 0 }).eq('id', currentUser.uid);
      return { success: true };
    },
    onSuccess: () => {
      if (currentUser?.uid) {
        try { sessionStorage.removeItem(`user_profile_${currentUser.uid}`); } catch {}
      }
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.refetchQueries({ queryKey: ['userProfile'] });
    },
  });
}
