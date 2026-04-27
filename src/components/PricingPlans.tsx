import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PRICING, formatPrice, type Currency, type PlanName } from "@/lib/pricing";

interface PricingPlansProps {
  currentPlan?: string;
  onUpgrade?: (plan: any, billingPeriod?: "monthly" | "yearly") => void;
  showBillingToggle?: boolean;
  showCurrentPlanBadge?: boolean;
  className?: string;
}

// null = not included in this plan
type PlanFeatureMap = { Free: string | null; Starter: string | null; Professional: string | null };

const masterFeatures: { key: string; text: PlanFeatureMap }[] = [
  { key: "upload",          text: { Free: "10 minutes of upload per month",        Starter: "150 minutes of upload per month",     Professional: "350 minutes of upload per month" } },
  { key: "videoLength",     text: { Free: "Up to 10 minute video length",           Starter: "Up to 30 minute video length",        Professional: "Up to 2 hour video length" } },
  { key: "exportQuality",   text: { Free: "720p exports",                           Starter: "1080p HD exports",                    Professional: "4K exports" } },
  { key: "clipGeneration",  text: { Free: "AI-powered clip generation",             Starter: "AI-powered clip generation",          Professional: "AI-powered clip generation" } },
  { key: "aiTitles",        text: { Free: "AI title & description generation",      Starter: "AI title & description generation",   Professional: "AI title & description generation" } },
  { key: "captions",        text: { Free: "Auto captions",                          Starter: "Advanced auto captions",              Professional: "Advanced auto captions" } },
  { key: "templates",       text: { Free: "Basic templates",                        Starter: "Premium templates",                   Professional: "All premium templates" } },
  { key: "support",         text: { Free: "Community support",                      Starter: "Priority email support",              Professional: "Priority support with 24hr response" } },
  { key: "watermark",       text: { Free: null,                                     Starter: "No watermark",                        Professional: "No watermark" } },
  { key: "viralityScore",   text: { Free: null,                                     Starter: "AI virality score",                   Professional: "AI virality score" } },
  { key: "socialScheduler", text: { Free: null,                                     Starter: null,                                  Professional: "Social media scheduler" } },
];

const plansData = [
  { name: "Free",         monthlyPrice: 0,   yearlyPrice: 0,    description: "Get started with video editing",    popular: false },
  { name: "Starter",      monthlyPrice: 149, yearlyPrice: 1430, description: "Perfect for content creators",      popular: true  },
  { name: "Professional", monthlyPrice: 249, yearlyPrice: 2390, description: "For serious creators & brands",     popular: false },
];

export function PricingPlans({
  currentPlan,
  onUpgrade,
  showBillingToggle = false,
  showCurrentPlanBadge = false,
  className = ""
}: PricingPlansProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const currency: Currency = "INR";

  const plans = plansData.map(plan => {
    const isCurrent = showCurrentPlanBadge && plan.name === currentPlan;
    const actualPrice = plan.monthlyPrice === 0
      ? 0
      : billingPeriod === "monthly"
        ? (PRICING[plan.name as Exclude<PlanName, 'Free'>]?.monthly[currency] || plan.monthlyPrice)
        : (PRICING[plan.name as Exclude<PlanName, 'Free'>]?.yearly[currency] || plan.yearlyPrice);

    const planName = plan.name as keyof PlanFeatureMap;
    const included = masterFeatures.filter(f => f.text[planName] !== null);
    const excluded = masterFeatures.filter(f => f.text[planName] === null);

    // fallback text for excluded items: use Starter or Professional text
    const excludedWithText = excluded.map(f => ({
      key: f.key,
      displayText: f.text.Professional ?? f.text.Starter ?? f.key,
    }));

    return {
      ...plan,
      current: isCurrent,
      price: plan.monthlyPrice === 0 ? "₹0" : formatPrice(actualPrice, currency),
      period: plan.monthlyPrice === 0 ? "/forever" : billingPeriod === "monthly" ? "/month" : "/year",
      savings: billingPeriod === "yearly" && plan.monthlyPrice > 0
        ? Math.round(((plan.monthlyPrice * 12 - plan.yearlyPrice) / (plan.monthlyPrice * 12)) * 100)
        : 0,
      actualAmount: actualPrice,
      included,
      excludedWithText,
      planName,
    };
  });

  return (
    <div className={className}>
      {showBillingToggle && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-2xl font-bold">Available Plans</h2>
          <Tabs
            value={billingPeriod}
            onValueChange={(value) => setBillingPeriod(value as "monthly" | "yearly")}
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
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((tier) => (
          <Card
            key={tier.name}
            className={`shadow-medium relative ${
              tier.current
                ? "border-primary border-2 shadow-glow"
                : tier.popular
                ? "border-primary border-2 shadow-glow scale-105"
                : ""
            }`}
          >
            {tier.current && showCurrentPlanBadge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-medium shadow-sm">
                Current Plan
              </div>
            )}
            {tier.popular && !tier.current && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-4 py-1 rounded-full text-xs font-medium shadow-sm">
                Most Popular
              </div>
            )}
            <CardContent className="p-6">
              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
              <p className="text-muted-foreground mb-4 text-sm">{tier.description}</p>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
                {tier.savings > 0 && billingPeriod === "yearly" && (
                  <p className="text-sm text-green-600 font-medium mt-2">
                    Save {formatPrice(tier.monthlyPrice * 12 - tier.yearlyPrice, currency)} per year
                  </p>
                )}
              </div>
              {onUpgrade && (
                <Button
                  className={`w-full mb-6 ${
                    tier.current || (tier.name === "Free" && currentPlan && (currentPlan === "Starter" || currentPlan === "Professional"))
                      ? "bg-muted text-muted-foreground cursor-default"
                      : tier.popular
                      ? "gradient-primary shadow-medium"
                      : "gradient-primary"
                  }`}
                  disabled={tier.current || (tier.name === "Free" && currentPlan && (currentPlan === "Starter" || currentPlan === "Professional"))}
                  onClick={() => onUpgrade(tier, billingPeriod)}
                  title={
                    tier.name === "Free" && currentPlan && (currentPlan === "Starter" || currentPlan === "Professional")
                      ? "Cancel your current subscription to downgrade to Free plan"
                      : undefined
                  }
                >
                  {tier.current
                    ? "Current Plan"
                    : tier.name === "Free" && currentPlan && (currentPlan === "Starter" || currentPlan === "Professional")
                    ? "Not Available"
                    : tier.name === "Free"
                    ? "Get Started"
                    : "Upgrade"}
                </Button>
              )}
              <ul className="space-y-3">
                {tier.included.map((f) => (
                  <li key={f.key} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{f.text[tier.planName]}</span>
                  </li>
                ))}
                {tier.excludedWithText.map((f) => (
                  <li key={f.key} className="flex items-start gap-2 text-sm">
                    <X className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="opacity-40">{f.displayText}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
