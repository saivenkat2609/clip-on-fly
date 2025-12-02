import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Check, Zap, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [videos, setVideos] = useState<Video[]>([]);
  const [projectsCount, setProjectsCount] = useState(0);
  const [clipsCount, setClipsCount] = useState(0);
  const [userPlan, setUserPlan] = useState<string>("Free");
  const [totalCredits, setTotalCredits] = useState<number>(60);
  const [usedCredits, setUsedCredits] = useState<number>(0);
  const [creditsExpiry, setCreditsExpiry] = useState<Date | null>(null);

  // Fetch user plan and credits data
  useEffect(() => {
    if (!currentUser) return;

    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const plan = userData.plan || "Free";
          setUserPlan(plan);

          // Get total credits based on plan
          let planCredits = userData.totalCredits || 60;
          if (!userData.totalCredits) {
            // Set default credits based on plan
            planCredits = plan === "Professional" ? 500 : plan === "Starter" ? 300 : 60;
          }
          setTotalCredits(planCredits);

          // Get credits expiry
          const expiryDate = userData.creditsExpiryDate?.toDate() || null;
          setCreditsExpiry(expiryDate);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    fetchUserData();
  }, [currentUser]);

  // Fetch videos data from Firebase
  useEffect(() => {
    if (!currentUser) return;

    const videosRef = collection(db, `users/${currentUser.uid}/videos`);
    const q = query(videosRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const videosData: Video[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Video));

        setVideos(videosData);

        // Calculate stats
        const totalProjects = videosData.length;
        const totalClips = videosData.reduce((acc, video) => {
          return acc + (video.clips?.length || 0);
        }, 0);

        setProjectsCount(totalProjects);
        setClipsCount(totalClips);

        // Calculate used credits (sum of all video durations in minutes)
        console.log("=== CREDITS CALCULATION DEBUG ===");
        console.log(`Total videos: ${videosData.length}`);

        const creditsUsed = videosData.reduce((sum, video) => {
          if (video.videoInfo?.duration) {
            const durationInSeconds = video.videoInfo.duration;
            const durationInMinutes = Math.floor(durationInSeconds / 60);
            console.log(`Video ${video.id}: ${durationInSeconds}s = ${durationInMinutes} minutes (credits)`);
            return sum + durationInMinutes;
          } else {
            console.log(`Video ${video.id}: No duration info`);
          }
          return sum;
        }, 0);

        console.log(`Total credits used: ${creditsUsed} minutes`);
        console.log(`Total credits available: ${totalCredits} minutes`);
        console.log(`Credits remaining: ${Math.max(0, totalCredits - creditsUsed)} minutes`);
        console.log("=================================");

        setUsedCredits(creditsUsed);
      },
      (err) => {
        console.error("Error fetching videos:", err);
      }
    );

    return () => unsubscribe();
  }, [currentUser, totalCredits]);

  // Generate plans with current pricing based on billing period
  const plans = plansData.map(plan => ({
    ...plan,
    price: plan.monthlyPrice === 0
      ? "$0"
      : billingPeriod === "monthly"
        ? `$${plan.monthlyPrice}`
        : `$${plan.yearlyPrice}`,
    period: plan.monthlyPrice === 0
      ? "/forever"
      : billingPeriod === "monthly"
        ? "/month"
        : "/year",
    savings: billingPeriod === "yearly" && plan.monthlyPrice > 0
      ? Math.round(((plan.monthlyPrice * 12 - plan.yearlyPrice) / (plan.monthlyPrice * 12)) * 100)
      : 0
  }));

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
                  <Button variant="outline" className="w-full">
                    Update Payment Method
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Available Plans */}
        <div id="available-plans">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold">Available Plans</h2>
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
            {userPlan === "Free" ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No billing history yet</p>
                <p className="text-sm text-muted-foreground">
                  You're currently on the Free plan. Upgrade to access premium features.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {[
                  { date: "Nov 15, 2024", amount: "$79.00", status: "Paid", plan: "Professional" },
                  { date: "Oct 15, 2024", amount: "$79.00", status: "Paid", plan: "Professional" },
                  { date: "Sep 15, 2024", amount: "$29.00", status: "Paid", plan: "Starter" }
                ].map((invoice, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-smooth"
                  >
                    <div>
                      <p className="font-medium">{invoice.date}</p>
                      <p className="text-sm text-muted-foreground">{invoice.plan} Plan</p>
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
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
