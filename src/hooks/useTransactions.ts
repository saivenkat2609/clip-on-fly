import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { Currency, PlanName, BillingPeriod } from '@/lib/pricing';

export interface Transaction {
  id: string;
  razorpayPaymentId: string;
  razorpaySubscriptionId: string;
  razorpayInvoiceId?: string;
  userId: string;
  planName: PlanName;
  billingPeriod: BillingPeriod;
  amount: number;
  currency: Currency;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  method?: string;
  cardLast4?: string;
  cardNetwork?: string;
  description: string;
  paidAt?: any;
  createdAt: any;
}

export function useTransactions() {
  const { currentUser } = useAuth();

  return useQuery({
    queryKey: ['transactions', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return [];

      const { data: rows, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', currentUser.uid)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (rows ?? []).map((row): Transaction => ({
        id: row.id,
        razorpayPaymentId: row.razorpay_payment_id,
        razorpaySubscriptionId: row.razorpay_subscription_id,
        razorpayInvoiceId: row.razorpay_invoice_id,
        userId: row.user_id,
        planName: row.plan_name,
        billingPeriod: row.billing_period,
        amount: row.amount,
        currency: row.currency,
        status: row.status,
        method: row.method,
        cardLast4: row.card_last4,
        cardNetwork: row.card_network,
        description: row.description,
        paidAt: row.paid_at,
        createdAt: row.created_at,
      }));
    },
    enabled: !!currentUser,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useLatestTransaction() {
  const { data: transactions = [] } = useTransactions();
  return transactions[0] || null;
}

export function useSuccessfulTransactions() {
  const { data: transactions = [], ...rest } = useTransactions();
  return {
    ...rest,
    data: transactions.filter(t => t.status === 'captured' || t.status === 'authorized'),
  };
}
