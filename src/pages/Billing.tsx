import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Zap, Calendar, Download, AlertTriangle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUserPlan } from "@/hooks/useUserProfile";
import { useVideos } from "@/hooks/useVideos";
import { useActiveSubscription, useCancelSubscription, useMarkAllVideosAsTracked, useResetCreditsForTesting } from "@/hooks/useSubscription";
import { useTransactions } from "@/hooks/useTransactions";
import { PaymentModal } from "@/components/PaymentModal";
import { UsageWarningBanner } from "@/components/UsageWarningBanner";
import { PRICING, formatPrice, type Currency, type PlanName } from "@/lib/pricing";
import { useToast } from "@/hooks/use-toast";
import { loadRazorpayScript } from "@/lib/razorpay";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
      "30 minutes of upload per month",
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
    monthlyPrice: 149,
    yearlyPrice: 1430, // ~20% discount (29 * 12 = 348, yearly = 279)
    description: "Perfect for content creators",
    features: [
      "150 minutes of upload per month",
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
    monthlyPrice: 249,
    yearlyPrice: 2390, // ~20% discount (79 * 12 = 948, yearly = 758)
    description: "For serious creators & brands",
    features: [
      "350 minutes of upload per month",
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
  const currency: Currency = "INR"; // Fixed to INR only
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Use cached hooks
  const { plan: userPlan = "Free", totalCredits = 30, creditsUsed: userCreditsUsed = 0, creditsExpiryDate, subscriptionStatus } = useUserPlan();
  const { data: videos = [] } = useVideos();
  const { data: activeSubscription } = useActiveSubscription();
  const { data: transactions = [] } = useTransactions();
  const cancelSubscription = useCancelSubscription();

  // Developer utility hooks
  const markAllVideosAsTracked = useMarkAllVideosAsTracked();
  const resetCredits = useResetCreditsForTesting();

  // Preload Razorpay script on component mount for faster checkout
  useEffect(() => {
    loadRazorpayScript().then((loaded) => {
      if (loaded) {
        console.log('Razorpay script preloaded successfully');
      } else {
        console.warn('Failed to preload Razorpay script');
      }
    });
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
  const { projectsCount, clipsCount } = useMemo(() => {
    const totalProjects = videos.length;
    const totalClips = videos.reduce((acc, video) => {
      return acc + (video.clips?.length || 0);
    }, 0);

    return {
      projectsCount: totalProjects,
      clipsCount: totalClips,
    };
  }, [videos]);

  // Use credits from user profile (tracked in backend) instead of calculating manually
  const usedCredits = userCreditsUsed;

  // Handle upgrade button click
  const handleUpgrade = (plan: any) => {
    if (plan.name === 'Free') {
      // Free plan doesn't need payment
      return;
    }

    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  // Handle cancel subscription - Open dialog
  const handleCancelSubscription = () => {
    if (!activeSubscription) return;
    setIsCancelDialogOpen(true);
  };

  // Confirm cancellation
  const confirmCancellation = async () => {
    if (!activeSubscription) return;

    setIsCancelling(true);

    try {
      await cancelSubscription.mutateAsync({
        subscriptionId: activeSubscription.razorpaySubscriptionId,
        cancelAtCycleEnd: true,
      });

      toast({
        title: 'Subscription Cancelled',
        description: 'Your subscription will be cancelled at the end of the billing period. You will retain access until then.',
      });

      setIsCancelDialogOpen(false);

      // Refresh page to update UI
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'Failed to cancel subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
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
      price:
        plan.monthlyPrice === 0 ? "₹0" : formatPrice(actualPrice, currency),
      period:
        plan.monthlyPrice === 0
          ? "/forever"
          : billingPeriod === "monthly"
          ? "/month"
          : "/year",
      savings:
        billingPeriod === "yearly" && plan.monthlyPrice > 0
          ? Math.round(
              ((plan.monthlyPrice * 12 - plan.yearlyPrice) /
                (plan.monthlyPrice * 12)) *
                100
            )
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
          <p className="text-muted-foreground">
            Manage your subscription and billing
          </p>
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
                  <span className="text-sm text-muted-foreground">
                    Video Processing
                  </span>
                  <span className="text-sm font-medium">
                    {usedCredits} / {totalCredits} minutes
                  </span>
                </div>
                <Progress
                  value={
                    totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0
                  }
                  className="h-3"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {Math.max(0, totalCredits - usedCredits)} minutes remaining
                  {creditsExpiry &&
                    ` • Renews ${creditsExpiry.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">
                    Projects Created
                  </p>
                  <p className="text-2xl font-bold">{projectsCount}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">
                    Clips Generated
                  </p>
                  <p className="text-2xl font-bold">{clipsCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-lg">
                {userPlan === "Free" ? "Upgrade Plan" : activeSubscription?.cancelledAt ? "Subscription Ending" : "Next Billing"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {userPlan === "Free" ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    You're on the Free plan. Upgrade to unlock more features and
                    remove watermarks.
                  </p>
                  <Button
                    className="w-full gradient-primary"
                    onClick={() => {
                      document
                        .getElementById("available-plans")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    View Plans
                  </Button>
                </>
              ) : (
                <>
                  {activeSubscription?.cancelledAt && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium text-amber-900">Cancellation Scheduled</p>
                          <p className="text-amber-700 mt-1">
                            Your subscription will end on {creditsExpiry?.toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric"
                            })}. You'll have access until then.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {activeSubscription?.cancelledAt ? "Access Until" : "Next Billing Date"}
                      </p>
                      <p className="font-medium">
                        {creditsExpiry?.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }) || "Not set"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-medium">
                        {activeSubscription?.amount && activeSubscription?.currency
                          ? formatPrice(activeSubscription.amount / 100, activeSubscription.currency)
                          : userPlan !== "Free"
                          ? formatPrice(
                              PRICING[userPlan as Exclude<PlanName, 'Free'>]?.monthly[currency] || 0,
                              currency
                            )
                          : formatPrice(0, currency)}
                      </p>
                    </div>
                  </div>
                  {subscriptionStatus === "active" && activeSubscription && (
                    activeSubscription.cancelledAt ? (
                      <Button
                        variant="outline"
                        className="w-full bg-amber-100 border-amber-600 text-amber-800 font-medium hover:bg-amber-100"
                        disabled
                      >
                        Cancellation Scheduled
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={handleCancelSubscription}
                      >
                        Cancel Subscription
                      </Button>
                    )
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
              {/* Billing Period Toggle */}
              <Tabs
                value={billingPeriod}
                onValueChange={(value) =>
                  setBillingPeriod(value as "monthly" | "yearly")
                }
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
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
                    ? "border-primary border-2 shadow-glow"
                    : plan.popular
                    ? "border-primary border-2 shadow-glow scale-105"
                    : ""
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
                  <p className="text-muted-foreground mb-4 text-sm">
                    {plan.description}
                  </p>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">
                        {plan.period}
                      </span>
                    </div>
                    {plan.savings > 0 && billingPeriod === "yearly" && (
                      <p className="text-sm text-green-600 font-medium mt-2">
                        Save {formatPrice(plan.monthlyPrice * 12 - plan.yearlyPrice, currency)} per year
                      </p>
                    )}
                  </div>
                  <Button
                    className={`w-full mb-6 ${
                      plan.current || (plan.name === "Free" && (userPlan === "Starter" || userPlan === "Professional"))
                        ? "bg-muted text-muted-foreground cursor-default"
                        : plan.popular
                        ? "gradient-primary shadow-medium"
                        : "gradient-primary"
                    }`}
                    disabled={plan.current || (plan.name === "Free" && (userPlan === "Starter" || userPlan === "Professional"))}
                    onClick={() => handleUpgrade(plan)}
                    title={
                      plan.name === "Free" && (userPlan === "Starter" || userPlan === "Professional")
                        ? "Cancel your current subscription to downgrade to Free plan"
                        : undefined
                    }
                  >
                    {plan.current
                      ? "Current Plan"
                      : plan.name === "Free" && (userPlan === "Starter" || userPlan === "Professional")
                      ? "Not Available"
                      : plan.name === "Free"
                      ? "Get Started"
                      : "Upgrade"}
                  </Button>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
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
                <p className="text-muted-foreground mb-4">
                  No billing history yet
                </p>
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
                          ? new Date(
                              transaction.paidAt.toDate()
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : new Date(
                              transaction.createdAt.toDate()
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.description}
                      </p>
                      {transaction.cardLast4 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {transaction.cardNetwork?.toUpperCase()} ****
                          {transaction.cardLast4}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant="outline"
                        className={
                          transaction.status === "captured" ||
                          transaction.status === "authorized"
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : transaction.status === "failed"
                            ? "bg-red-500/10 text-red-600 border-red-500/20"
                            : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                        }
                      >
                        {transaction.status === "captured"
                          ? "Paid"
                          : transaction.status}
                      </Badge>
                      <p className="font-semibold">
                        {formatPrice(
                          transaction.amount / 100,
                          transaction.currency
                        )}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (transaction.razorpayInvoiceId) {
                            // Open Razorpay invoice page
                            window.open(
                              `https://dashboard.razorpay.com/app/invoices/${transaction.razorpayInvoiceId}`,
                              "_blank"
                            );
                          } else {
                            toast({
                              title: "Invoice Not Available",
                              description:
                                "Invoice details are not available for this transaction.",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={!transaction.razorpayInvoiceId}
                        title={
                          transaction.razorpayInvoiceId
                            ? "View Invoice"
                            : "Invoice not available"
                        }
                      >
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

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p>
                Are you sure you want to cancel your <strong>{userPlan}</strong> subscription?
              </p>
              <div className="bg-muted p-3 rounded-md space-y-2 text-sm">
                <p className="font-medium text-foreground">What happens next:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Your subscription will be cancelled at the end of the current billing period</li>
                  <li>You'll retain access to premium features until {creditsExpiry?.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  }) || "the end of your billing cycle"}</li>
                  <li>After that, your account will be downgraded to the Free plan</li>
                  <li>No further charges will be made</li>
                </ul>
              </div>
              <p className="text-destructive font-medium">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Keep Subscription
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancellation}
              disabled={isCancelling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isCancelling ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Cancelling...
                </>
              ) : (
                "Yes, Cancel Subscription"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Developer Tools - FIX CREDIT TRACKING */}
      <Card className="border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
        <CardHeader>
          <CardTitle className="text-amber-900 dark:text-amber-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Developer Tools - Fix Credit Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>Issue:</strong> Old videos don't have the <code className="bg-amber-200 dark:bg-amber-900 px-1 rounded">usageTracked</code> flag, so credits are being deducted multiple times on page refresh.
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>Fix:</strong> Run these utilities in order:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mark Videos as Tracked */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Step 1: Mark All Videos</h4>
              <p className="text-xs text-muted-foreground">
                Marks all your existing videos as tracked to prevent future double-charging
              </p>
              <Button
                onClick={() => {
                  markAllVideosAsTracked.mutate(undefined, {
                    onSuccess: (data) => {
                      toast({
                        title: 'Videos Marked Successfully',
                        description: `Marked ${data.markedCount} videos. ${data.alreadyMarkedCount} were already marked.`,
                      });
                    },
                    onError: (error: any) => {
                      toast({
                        title: 'Failed to Mark Videos',
                        description: error.message,
                        variant: 'destructive',
                      });
                    },
                  });
                }}
                disabled={markAllVideosAsTracked.isPending}
                className="w-full bg-amber-600 hover:bg-amber-700"
              >
                {markAllVideosAsTracked.isPending ? 'Marking...' : 'Mark All Videos as Tracked'}
              </Button>
            </div>

            {/* Reset Credits */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Step 2: Reset Credits</h4>
              <p className="text-xs text-muted-foreground">
                Resets your creditsUsed to 0. Upload fresh videos after this to test proper tracking.
              </p>
              <Button
                onClick={() => {
                  resetCredits.mutate(undefined, {
                    onSuccess: (data) => {
                      toast({
                        title: 'Credits Reset Successfully',
                        description: data.message,
                      });
                      // Force page reload to show updated credits
                      setTimeout(() => window.location.reload(), 1000);
                    },
                    onError: (error: any) => {
                      toast({
                        title: 'Failed to Reset Credits',
                        description: error.message,
                        variant: 'destructive',
                      });
                    },
                  });
                }}
                disabled={resetCredits.isPending}
                variant="destructive"
                className="w-full"
              >
                {resetCredits.isPending ? 'Resetting...' : 'Reset Credits to 0'}
              </Button>
            </div>
          </div>

          <div className="bg-amber-100 dark:bg-amber-900/40 p-3 rounded-md">
            <p className="text-xs text-amber-900 dark:text-amber-200">
              <strong>After running both steps:</strong> All existing videos will be marked as tracked, preventing future double-charging. Your credits will be reset to 0. You can then upload fresh videos to verify proper tracking (each video should only deduct credits once, even after page refresh).
            </p>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
