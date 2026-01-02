/**
 * Pricing Configuration
 * Centralized pricing for all plans and currencies
 */

export type PlanName = 'Free' | 'Starter' | 'Professional';
export type BillingPeriod = 'monthly' | 'yearly';
export type Currency = 'INR' | 'USD';

/**
 * Plan pricing in different currencies
 * Yearly plans have ~20% discount built in
 */
export const PRICING: Record<
  Exclude<PlanName, 'Free'>,
  Record<BillingPeriod, Record<Currency, number>>
> = {
  Starter: {
    monthly: {
      USD: 29,
      INR: 149, // Approx $29 USD = ₹2,400
    },
    yearly: {
      USD: 279, // Save $69 (20% discount from $348)
      INR: 1430, // Save ₹5,600 (20% discount from ₹28,800)
    },
  },
  Professional: {
    monthly: {
      USD: 249,
      INR: 249, // Approx $79 USD = ₹6,560
    },
    yearly: {
      USD: 758, // Save $190 (20% discount from $948)
      INR: 2390, // Save ₹15,656 (20% discount from ₹78,720)
    },
  },
};

/**
 * Format price with currency symbol
 */
export function formatPrice(amount: number, currency: Currency): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get price for a plan
 */
export function getPlanPrice(
  planName: Exclude<PlanName, 'Free'>,
  billingPeriod: BillingPeriod,
  currency: Currency
): number {
  return PRICING[planName][billingPeriod][currency];
}

/**
 * Calculate yearly savings
 */
export function calculateYearlySavings(
  planName: Exclude<PlanName, 'Free'>,
  currency: Currency
): { amount: number; percentage: number } {
  const monthly = PRICING[planName].monthly[currency];
  const yearly = PRICING[planName].yearly[currency];
  const monthlyAnnual = monthly * 12;
  const savings = monthlyAnnual - yearly;
  const percentage = Math.round((savings / monthlyAnnual) * 100);

  return {
    amount: savings,
    percentage,
  };
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  return currency === 'INR' ? '₹' : '$';
}

/**
 * Convert amount from one currency to another (approximate)
 * Note: For real-time conversion, use an API like exchangerate-api.com
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) return amount;

  // Approximate conversion rate: 1 USD = 83 INR
  const USD_TO_INR = 83;

  if (fromCurrency === 'USD' && toCurrency === 'INR') {
    return Math.round(amount * USD_TO_INR);
  }

  if (fromCurrency === 'INR' && toCurrency === 'USD') {
    return Math.round(amount / USD_TO_INR);
  }

  return amount;
}
