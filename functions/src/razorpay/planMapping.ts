/**
 * Razorpay Plan Mapping Configuration
 * Maps frontend plan names to Razorpay plan IDs for different currencies
 */

export type PlanName = 'Free' | 'Starter' | 'Professional';
export type BillingPeriod = 'monthly' | 'yearly';
export type Currency = 'INR' | 'USD';

/**
 * Maps plan names + billing period + currency to Razorpay plan IDs
 * IMPORTANT: Create these plans in Razorpay dashboard before using
 */
export const PLAN_MAPPING: Record<
  Exclude<PlanName, 'Free'>,
  Record<BillingPeriod, Record<Currency, string>>
> = {
  Starter: {
    monthly: {
      INR: 'plan_starter_monthly_inr',
      USD: 'plan_starter_monthly_usd',
    },
    yearly: {
      INR: 'plan_starter_yearly_inr',
      USD: 'plan_starter_yearly_usd',
    },
  },
  Professional: {
    monthly: {
      INR: 'plan_professional_monthly_inr',
      USD: 'plan_professional_monthly_usd',
    },
    yearly: {
      INR: 'plan_professional_yearly_inr',
      USD: 'plan_professional_yearly_usd',
    },
  },
};

/**
 * Credit allocations per plan (in minutes)
 */
export const PLAN_CREDITS: Record<PlanName, number> = {
  Free: 60,           // 60 minutes per month
  Starter: 300,       // 300 minutes per month
  Professional: 500,  // 500 minutes per month
};

/**
 * Feature limits per plan
 */
export const PLAN_FEATURES: Record<PlanName, {
  maxVideoLength: number;     // in seconds
  exportQuality: '720p' | '1080p' | '4K';
  hasWatermark: boolean;
  hasAIViralityScore: boolean;
  hasCustomBranding: boolean;
  hasSocialScheduler: boolean;
  hasAITitleGeneration: boolean;
  supportLevel: 'community' | 'email' | 'priority';
}> = {
  Free: {
    maxVideoLength: 900,      // 15 minutes
    exportQuality: '720p',
    hasWatermark: true,
    hasAIViralityScore: false,
    hasCustomBranding: false,
    hasSocialScheduler: false,
    hasAITitleGeneration: false,
    supportLevel: 'community',
  },
  Starter: {
    maxVideoLength: 1800,     // 30 minutes
    exportQuality: '1080p',
    hasWatermark: false,
    hasAIViralityScore: true,
    hasCustomBranding: false,
    hasSocialScheduler: false,
    hasAITitleGeneration: false,
    supportLevel: 'email',
  },
  Professional: {
    maxVideoLength: 10800,    // 3 hours
    exportQuality: '4K',
    hasWatermark: false,
    hasAIViralityScore: true,
    hasCustomBranding: true,
    hasSocialScheduler: true,
    hasAITitleGeneration: true,
    supportLevel: 'priority',
  },
};

/**
 * Plan pricing (for reference)
 */
export const PLAN_PRICING = {
  Starter: {
    monthly: { USD: 29, INR: 2400 },      // ~$29 USD = ₹2,400
    yearly: { USD: 279, INR: 23200 },     // ~$279 USD = ₹23,200 (20% discount)
  },
  Professional: {
    monthly: { USD: 79, INR: 6560 },      // ~$79 USD = ₹6,560
    yearly: { USD: 758, INR: 63064 },     // ~$758 USD = ₹63,064 (20% discount)
  },
};

/**
 * Get plan ID from plan name, billing period, and currency
 */
export function getRazorpayPlanId(
  planName: PlanName,
  billingPeriod: BillingPeriod,
  currency: Currency
): string {
  if (planName === 'Free') {
    throw new Error('Free plan does not have a Razorpay plan ID');
  }

  const planId = PLAN_MAPPING[planName]?.[billingPeriod]?.[currency];

  if (!planId) {
    throw new Error(`Plan ID not found for ${planName} ${billingPeriod} ${currency}`);
  }

  return planId;
}

/**
 * Get credit allocation for a plan
 */
export function getPlanCredits(planName: PlanName): number {
  return PLAN_CREDITS[planName];
}

/**
 * Get features for a plan
 */
export function getPlanFeatures(planName: PlanName) {
  return PLAN_FEATURES[planName];
}

/**
 * Get plan pricing
 */
export function getPlanPrice(
  planName: Exclude<PlanName, 'Free'>,
  billingPeriod: BillingPeriod,
  currency: Currency
): number {
  return PLAN_PRICING[planName][billingPeriod][currency];
}

/**
 * Calculate discount percentage for yearly plans
 */
export function getYearlyDiscount(planName: Exclude<PlanName, 'Free'>, currency: Currency): number {
  const monthly = PLAN_PRICING[planName].monthly[currency];
  const yearly = PLAN_PRICING[planName].yearly[currency];
  const monthlyAnnual = monthly * 12;
  const discount = ((monthlyAnnual - yearly) / monthlyAnnual) * 100;
  return Math.round(discount);
}
