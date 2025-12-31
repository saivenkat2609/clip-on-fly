/**
 * Transaction/Billing History Hooks
 * Uses TanStack React Query for server state management
 */

import { useQuery } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

/**
 * Fetch all transactions for current user
 */
export function useTransactions() {
  const { currentUser } = useAuth();

  return useQuery({
    queryKey: ['transactions', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return [];

      const transactionsRef = collection(db, `users/${currentUser.uid}/transactions`);
      const q = query(transactionsRef, orderBy('createdAt', 'desc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Transaction[];
    },
    enabled: !!currentUser,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Get latest transaction
 */
export function useLatestTransaction() {
  const { data: transactions = [] } = useTransactions();
  return transactions[0] || null;
}

/**
 * Get successful transactions only
 */
export function useSuccessfulTransactions() {
  const { data: transactions = [], ...rest } = useTransactions();

  const successfulTransactions = transactions.filter(
    t => t.status === 'captured' || t.status === 'authorized'
  );

  return {
    ...rest,
    data: successfulTransactions,
  };
}
