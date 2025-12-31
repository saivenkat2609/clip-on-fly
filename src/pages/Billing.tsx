import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Zap, Calendar, Download } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserPlan } from "@/hooks/useUserProfile";
import { useVideos } from "@/hooks/useVideos";
import { useActiveSubscription, useCancelSubscription } from "@/hooks/useSubscription";
import { useTransactions } from "@/hooks/useTransactions";
import { PaymentModal } from "@/components/PaymentModal";
import { UsageWarningBanner } from "@/components/UsageWarningBanner";
import { getUserCurrency } from "@/lib/currencyDetector";
import { PRICING, formatPrice, type Currency, type PlanName } from "@/lib/pricing";
import { useToast } from "@/hooks/use-toast";

interface VideoClip {
  clipIndex: number;
  downloadUrl: string;
}

interface Video {
  id: string;
  sessionId: string;
  status: "pending" | "processing" | "completed" | "failed";
  clips?: VideoClip[];
  videoInfo?: {
    title?: string;
    duration?: number;
    thumbnail?: string;
  };
}

const plansData = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Get started with video editing",
    features: [
      "60 minutes of upload per month",
      "Up to 15 minute video length",
      "720p exports",
      "AI-powered clip generation",
      "Auto captions",
      "Basic templates",
      "Watermarked exports",
      "Community support"
    ],
    popular: false,
    current: true
  },
  {
    name: "Starter",
    monthlyPrice: 29,
    yearlyPrice: 279, // ~20% discount (29 * 12 = 348, yearly = 279)
    description: "Perfect for content creators",
    features: [
      "300 minutes of upload per month",
      "Up to 30 minute video length",
      "1080p HD exports",
      "AI-powered clip generation",
      "Advanced auto captions",
      "Premium templates",
      "No watermark",
      "AI virality score",
      "Multi-language support",
      "Priority email support"
    ],
    popular: true,
    current: false
  },
  {
    name: "Professional",
    monthlyPrice: 79,
    yearlyPrice: 758, // ~20% discount (79 * 12 = 948, yearly = 758)
    description: "For serious creators & brands",
    features: [
      "500 minutes of upload per month",
      "Up to 3 hour video length",
      "4K exports",
      "AI-powered clip generation",
      "Advanced auto captions",
      "All premium templates",
      "No watermark",
      "AI virality score",
      "Multi-language support",
      "Custom branding",
      "Social media scheduler",
      "AI title & description generation",
      "Priority support with 24h response"
    ],
    popular: false,
    current: false
  }
];

export default function Billing() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Use cached hooks
  const { plan: userPlan = "Free", totalCredits = 60, creditsExpiryDate, subscriptionStatus } = useUserPlan();
  const { data: videos = [] } = useVideos();
  const { data: activeSubscription } = useActiveSubscription();
  const { data: transactions = [] } = useTransactions();
  const cancelSubscription = useCancelSubscription();

  // Auto-detect user currency on mount
  useEffect(() => {
    getUserCurrency().then(setCurrency);
  }, []);

  // Convert Firestore timestamp or ISO string to Date
  const creditsExpiry = useMemo(() => {
    if (!creditsExpiryDate) return null;

    // Handle Firestore Timestamp
    if (creditsExpiryDate?.toDate) {
      return creditsExpiryDate.toDate();
    }

    // Handle ISO string from cache
    if (typeof creditsExpiryDate === 'string') {
      return new Date(creditsExpiryDate);
    }

    return null;
  }, [creditsExpiryDate]);

  // Calculate stats from videos - memoized for performance
  const { projectsCount, clipsCount, usedCredits } = useMemo(() => {
    const totalProjects = videos.length;
    const totalClips = videos.reduce((acc, video) => {
      return acc + (video.clips?.length || 0);
    }, 0);

    // Calculate used credits (sum of all video durations in minutes)
    const creditsUsed = videos.reduce((sum, video) => {
      if (video.videoInfo?.duration) {
        const durationInSeconds = video.videoInfo.duration;
        const durationInMinutes = Math.floor(durationInSeconds / 60);
        return sum + durationInMinutes;
      }
      return sum;
    }, 0);

    return {
      projectsCount: totalProjects,
      clipsCount: totalClips,
      usedCredits: creditsUsed,
    };
  }, [videos]);

  // Handle upgrade button click
  const handleUpgrade = (plan: any) => {
    if (plan.name === 'Free') {
      // Free plan doesn't need payment
      return;
    }

    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    if (!activeSubscription) return;

    const confirmCancel = window.confirm(
      'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing cycle.'
    );

    if (confirmCancel) {
      try {
        await cancelSubscription.mutateAsync({
          subscriptionId: activeSubscription.razorpaySubscriptionId,
          cancelAtCycleEnd: true,
        });

        toast({
          title: 'Subscription Cancelled',
          description: 'Your subscription will be cancelled at the end of the billing period.',
        });
      } catch (error: any) {
        toast({
          title: 'Cancellation Failed',
          description: error.message || 'Failed to cancel subscription. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  // Generate plans with current pricing based on billing period and currency
  const plans = plansData.map(plan => {
    const isCurrent = plan.name === userPlan;
    const actualPrice = plan.monthlyPrice === 0
      ? 0
      : billingPeriod === "monthly"
        ? (PRICING[plan.name as Exclude<PlanName, 'Free'>]?.monthly[currency] || plan.monthlyPrice)
        : (PRICING[plan.name as Exclude<PlanName, 'Free'>]?.yearly[currency] || plan.yearlyPrice);

    return {
      ...plan,
      current: isCurrent,
      price: plan.monthlyPrice === 0
        ? "$0"
        : formatPrice(actualPrice, currency),
      period: plan.monthlyPrice === 0
        ? "/forever"
        : billingPeriod === "monthly"
          ? "/month"
          : "/year",
      savings: billingPeriod === "yearly" && plan.monthlyPrice > 0
        ? Math.round(((plan.monthlyPrice * 12 - plan.yearlyPrice) / (plan.monthlyPrice * 12)) * 100)
        : 0,
      actualAmount: actualPrice,
    };
  });

  return (
    <AppLayout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
          <p className="text-muted-foreground">Manage your subscription and billing</p>
        </div>

        {/* Usage Warning Banner */}
        <UsageWarningBanner />

        {/* Current Usage */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="md:col-span-2 shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Usage This Month</span>
                <Badge className="bg-primary text-primary-foreground">
                  {userPlan}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Video Processing</span>
                  <span className="text-sm font-medium">
                    {usedCredits} / {totalCredits} minutes
                  </span>
                </div>
                <Progress
                  value={totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0}
                  className="h-3"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {Math.max(0, totalCredits - usedCredits)} minutes remaining
                  {creditsExpiry && ` • Renews ${creditsExpiry.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Projects Created</p>
                  <p className="text-2xl font-bold">{projectsCount}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Clips Generated</p>
                  <p className="text-2xl font-bold">{clipsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-lg">
                {userPlan === "Free" ? "Upgrade Plan" : "Next Billing"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userPlan === "Free" ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    You're on the Free plan. Upgrade to unlock more features and remove watermarks.
                  </p>
                  <Button
                    className="w-full gradient-primary"
                    onClick={() => {
                      document.getElementById('available-plans')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    View Plans
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Next Billing Date</p>
                      <p className="font-medium">
                        {creditsExpiry?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || "Not set"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-medium">
                        ${userPlan === "Starter" ? "29" : userPlan === "Professional" ? "79" : "0"}
                      </p>
                    </div>
                  </div>
                  {subscriptionStatus === 'active' && activeSubscription && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleCancelSubscription}
                    >
                      Cancel Subscription
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Available Plans */}
        <div id="available-plans">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold">Available Plans</h2>
            <div className="flex gap-4">
              {/* Currency Toggle */}
              <Tabs value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="USD">USD ($)</TabsTrigger>
                  <TabsTrigger value="INR">INR (₹)</TabsTrigger>
                </TabsList>
              </Tabs>
              {/* Billing Period Toggle */}
              <Tabs value={billingPeriod} onValueChange={(value) => setBillingPeriod(value as "monthly" | "yearly")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="monthly">
                    Monthly
                  </TabsTrigger>
                  <TabsTrigger value="yearly" className="relative">
                    Yearly
                    <Badge className="ml-2 bg-green-500 text-white text-[10px] px-1.5 py-0">
                      Save 20%
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`shadow-medium relative ${
                  plan.current
                    ? 'border-primary border-2 shadow-glow'
                    : plan.popular
                    ? 'border-primary border-2 shadow-glow scale-105'
                    : ''
                }`}
              >
                {plan.current && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-medium shadow-sm">
                    Current Plan
                  </div>
                )}
                {plan.popular && !plan.current && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-1 rounded-full text-xs font-medium shadow-sm">
                    Most Popular
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground mb-4 text-sm">{plan.description}</p>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    {plan.savings > 0 && (
                      <p className="text-sm text-green-600 font-medium mt-2">
                        Save ${(plan.monthlyPrice * 12 - (billingPeriod === "yearly" ? parseInt(plan.price.replace('$', '')) : 0))} per year
                      </p>
                    )}
                  </div>
                  <Button
                    className={`w-full mb-6 ${
                      plan.current
                        ? 'bg-muted text-muted-foreground cursor-default'
                        : plan.popular
                        ? 'gradient-primary shadow-medium'
                        : 'gradient-primary'
                    }`}
                    disabled={plan.current}
                    onClick={() => handleUpgrade(plan)}
                  >
                    {plan.current ? 'Current Plan' : plan.name === 'Free' ? 'Get Started' : 'Upgrade'}
                  </Button>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Billing History */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No billing history yet</p>
                <p className="text-sm text-muted-foreground">
                  {userPlan === "Free"
                    ? "You're currently on the Free plan. Upgrade to access premium features."
                    : "Your transaction history will appear here once you make a payment."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth"
                  >
                    <div>
                      <p className="font-medium">
                        {transaction.paidAt
                          ? new Date(transaction.paidAt.toDate()).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : new Date(transaction.createdAt.toDate()).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                      </p>
                      <p className="text-sm text-muted-foreground">{transaction.description}</p>
                      {transaction.cardLast4 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {transaction.cardNetwork?.toUpperCase()} ****{transaction.cardLast4}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant="outline"
                        className={
                          transaction.status === 'captured' || transaction.status === 'authorized'
                            ? 'bg-green-500/10 text-green-600 border-green-500/20'
                            : transaction.status === 'failed'
                            ? 'bg-red-500/10 text-red-600 border-red-500/20'
                            : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                        }
                      >
                        {transaction.status === 'captured' ? 'Paid' : transaction.status}
                      </Badge>
                      <p className="font-semibold">
                        {formatPrice(transaction.amount / 100, transaction.currency)}
                      </p>
                      <Button variant="ghost" size="sm" disabled>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setSelectedPlan(null);
          }}
          planName={selectedPlan.name as PlanName}
          billingPeriod={billingPeriod}
          amount={selectedPlan.actualAmount}
          currency={currency}
        />
      )}
    </AppLayout>
  );
}
