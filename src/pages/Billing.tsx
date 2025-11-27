import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Zap, Calendar } from "lucide-react";

const currentPlan = {
  name: "Professional",
  price: 79,
  period: "month",
  billingDate: "Dec 15, 2024",
  minutesUsed: 98,
  minutesTotal: 150
};

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "Perfect for individual creators",
    features: [
      "30 minutes of video per month",
      "HD exports (1080p)",
      "Auto captions",
      "Basic templates",
      "Email support"
    ]
  },
  {
    name: "Professional",
    price: "$79",
    period: "/month",
    description: "For serious content creators",
    features: [
      "150 minutes of video per month",
      "4K exports",
      "Advanced AI features",
      "Premium templates",
      "Priority support",
      "Custom branding"
    ],
    current: true
  },
  {
    name: "Agency",
    price: "$199",
    period: "/month",
    description: "For teams and agencies",
    features: [
      "500 minutes of video per month",
      "4K exports",
      "Team collaboration",
      "API access",
      "White-label options",
      "Dedicated support"
    ]
  }
];

export default function Billing() {
  return (
    <AppLayout>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
          <p className="text-muted-foreground">Manage your subscription and billing</p>
        </div>

        {/* Current Usage */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="md:col-span-2 shadow-medium">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Usage This Month</span>
                <Badge className="bg-primary text-primary-foreground">
                  {currentPlan.name}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Video Processing</span>
                  <span className="text-sm font-medium">
                    {currentPlan.minutesUsed} / {currentPlan.minutesTotal} minutes
                  </span>
                </div>
                <Progress 
                  value={(currentPlan.minutesUsed / currentPlan.minutesTotal) * 100} 
                  className="h-3"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Projects Created</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Clips Generated</p>
                  <p className="text-2xl font-bold">156</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader>
              <CardTitle className="text-lg">Next Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{currentPlan.billingDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-medium">${currentPlan.price}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                Update Payment Method
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Available Plans */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card 
                key={plan.name}
                className={`shadow-medium relative ${
                  plan.current ? 'border-primary border-2 shadow-glow' : ''
                }`}
              >
                {plan.current && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
                    Current Plan
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-muted-foreground mb-4 text-sm">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <Button 
                    className={`w-full mb-6 ${
                      plan.current 
                        ? 'bg-muted text-muted-foreground cursor-default' 
                        : 'gradient-primary'
                    }`}
                    disabled={plan.current}
                  >
                    {plan.current ? 'Current Plan' : 'Upgrade'}
                  </Button>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
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
            <div className="space-y-4">
              {[
                { date: "Nov 15, 2024", amount: "$79.00", status: "Paid" },
                { date: "Oct 15, 2024", amount: "$79.00", status: "Paid" },
                { date: "Sep 15, 2024", amount: "$79.00", status: "Paid" }
              ].map((invoice, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth"
                >
                  <div>
                    <p className="font-medium">{invoice.date}</p>
                    <p className="text-sm text-muted-foreground">Professional Plan</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                      {invoice.status}
                    </Badge>
                    <p className="font-semibold">{invoice.amount}</p>
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
