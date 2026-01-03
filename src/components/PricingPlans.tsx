import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
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
  },
  {
    name: "Starter",
    monthlyPrice: 149,
    yearlyPrice: 1430,
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
  },
  {
    name: "Professional",
    monthlyPrice: 249,
    yearlyPrice: 2390,
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
  }
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

  // Generate plans with current pricing
  const plans = plansData.map(plan => {
    const isCurrent = showCurrentPlanBadge && plan.name === currentPlan;
    const actualPrice = plan.monthlyPrice === 0
      ? 0
      : billingPeriod === "monthly"
        ? (PRICING[plan.name as Exclude<PlanName, 'Free'>]?.monthly[currency] || plan.monthlyPrice)
        : (PRICING[plan.name as Exclude<PlanName, 'Free'>]?.yearly[currency] || plan.yearlyPrice);

    return {
      ...plan,
      current: isCurrent,
      price: plan.monthlyPrice === 0 ? "₹0" : formatPrice(actualPrice, currency),
      period: plan.monthlyPrice === 0 ? "/forever" : billingPeriod === "monthly" ? "/month" : "/year",
      savings: billingPeriod === "yearly" && plan.monthlyPrice > 0
        ? Math.round(((plan.monthlyPrice * 12 - plan.yearlyPrice) / (plan.monthlyPrice * 12)) * 100)
        : 0,
      actualAmount: actualPrice,
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
              <p className="text-muted-foreground mb-4 text-sm">
                {tier.description}
              </p>
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">
                    {tier.period}
                  </span>
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
                {tier.features.map((feature, index) => (
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
  );
}
