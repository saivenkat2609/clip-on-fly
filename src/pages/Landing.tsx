import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Footer } from "@/components/layout/Footer";
import { PricingPlans } from "@/components/PricingPlans";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Upload,
  Wand2,
  Download,
  Sparkles,
  Video,
  Scissors,
  Type,
  Palette,
  Clock,
  Star,
  Check,
  Users
} from "lucide-react";

const features = [
  {
    icon: Wand2,
    title: "AI-Powered Highlights",
    description: "Automatically detect the most engaging moments in your long-form content"
  },
  {
    icon: Scissors,
    title: "Smart Editing",
    description: "Intelligent cuts, transitions, and pacing optimized for short-form platforms"
  },
  {
    icon: Type,
    title: "Auto Captions",
    description: "Generate stylish, accurate captions with customizable fonts and colors"
  },
  {
    icon: Palette,
    title: "Brand Templates",
    description: "Apply professional templates that match your brand identity"
  },
  {
    icon: Video,
    title: "Multi-Format Export",
    description: "Export in 9:16, 16:9, or 1:1 aspect ratios for any platform"
  },
  {
    icon: Clock,
    title: "Batch Processing",
    description: "Process multiple videos simultaneously to save time"
  }
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Content Creator",
    content: "This tool has 10x my content output. What used to take hours now takes minutes.",
    rating: 5
  },
  {
    name: "Marcus Johnson",
    role: "Digital Agency Owner",
    content: "Our clients love the quality. It's like having a professional editor on demand.",
    rating: 5
  },
  {
    name: "Emily Rodriguez",
    role: "Social Media Manager",
    content: "The AI understands context better than I expected. It finds the perfect moments.",
    rating: 5
  }
];

const faqs = [
  {
    question: "How does the AI select highlights?",
    answer: "Our AI analyzes speech patterns, engagement hooks, emotional peaks, and visual dynamics to identify the most compelling moments in your content."
  },
  {
    question: "What video formats are supported?",
    answer: "We support all major video formats including MP4, MOV, AVI, and WebM. Maximum file size is 5GB per video."
  },
  {
    question: "Can I edit the AI-generated clips?",
    answer: "Yes! You have full control to adjust timestamps, modify captions, change styles, and fine-tune every aspect of your clips."
  },
  {
    question: "How long does processing take?",
    answer: "Most videos are processed in 2-5 minutes depending on length. You'll receive a notification when your clips are ready."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Absolutely. Cancel anytime from your billing settings. You'll retain access until the end of your billing period."
  }
];

export default function Landing() {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already logged in (unless coming from login)
  useEffect(() => {
    if (!loading && currentUser) {
      // Check if user just logged in and should go to billing
      const shouldRedirectToBilling = sessionStorage.getItem('redirectToBilling');
      if (shouldRedirectToBilling === 'true') {
        sessionStorage.removeItem('redirectToBilling');
        navigate('/billing', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [currentUser, loading, navigate]);

  // Handle upgrade button click
  const handleUpgrade = (plan: any) => {
    if (!currentUser) {
      // Store intent to redirect to billing after login
      sessionStorage.setItem('redirectToBilling', 'true');
      // Navigate to login
      navigate('/login');
    }
  };

  // Show nothing while checking auth or if redirecting
  if (loading || currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">NebulaAI</span>
            </div>

            {/* Navigation Links - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <button
                onClick={() => {
                  const element = document.getElementById('features');
                  const offset = 80;
                  const elementPosition = element?.getBoundingClientRect().top ?? 0;
                  const offsetPosition = elementPosition + window.pageYOffset - offset;
                  window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-all"
              >
                Features
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById('demo');
                  const offset = 80;
                  const elementPosition = element?.getBoundingClientRect().top ?? 0;
                  const offsetPosition = elementPosition + window.pageYOffset - offset;
                  window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-all"
              >
                Demo
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById('pricing');
                  const offset = 80;
                  const elementPosition = element?.getBoundingClientRect().top ?? 0;
                  const offsetPosition = elementPosition + window.pageYOffset - offset;
                  window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-all"
              >
                Pricing
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById('faq');
                  const offset = 80;
                  const elementPosition = element?.getBoundingClientRect().top ?? 0;
                  const offsetPosition = elementPosition + window.pageYOffset - offset;
                  window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background rounded-md transition-all"
              >
                FAQs
              </button>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
              </Link>
              <Link to="/login">
                <Button className="gradient-primary">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10 animate-gradient-shift" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />

        <div className="container relative mx-auto px-4 py-24 md:py-32">
          <div className="max-w-6xl mx-auto">
            {/* Social Proof Banner */}
            <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={i}
                      src={`/avatars/avatar${i}.png`}
                      alt={`Creator ${i}`}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-background"
                    />
                  ))}
                </div>
                <span className="font-medium">500+ creators</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4 text-primary" />
                <span className="font-medium">8k+ clips generated</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium">100+ hours saved daily</span>
              </div>
            </div>

            {/* Main Hero Content */}
            <div className="text-center mb-12">
              <div className="inline-block mb-4">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
                  <Sparkles className="h-4 w-4" />
                  AI-Powered Video Magic
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                Turn Long Videos Into
                <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-gradient-x">
                  Viral Short Clips
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
                AI automatically finds the best moments, edits, adds captions, and exports ready-to-post clips for TikTok, YouTube Shorts, and Instagram Reels
              </p>

              <div className="flex flex-col items-center mb-16">
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                  <Link to="/login">
                    <Button size="lg" className="gradient-primary shadow-glow text-lg h-16 px-10 font-semibold">
                      <Sparkles className="h-5 w-5 mr-2" />
                      Start Free Trial
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="text-lg h-16 px-10 font-semibold border-2 border-primary/30 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all">
                    <Video className="h-5 w-5 mr-2" />
                    Watch Demo
                  </Button>
                </div>

                {/* Trust indicators */}
                <div className="flex flex-wrap items-center justify-center gap-8 text-base text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="font-medium">No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="font-medium">Cancel anytime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-primary" />
                    <span className="font-medium">24/7 support</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Demo Preview */}
            <div id="demo" className="relative max-w-5xl mx-auto">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary via-accent to-primary rounded-3xl blur-3xl opacity-20 animate-pulse" />
              <Card className="relative shadow-2xl border-2 border-primary/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                <CardContent className="p-2">
                  <div className="relative aspect-video bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl overflow-hidden">
                    {/* Video placeholder with grid pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:64px_64px]" />

                    {/* Central play icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative group cursor-pointer">
                        <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                        <div className="relative h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                          <Video className="h-10 w-10 text-primary ml-1" />
                        </div>
                      </div>
                    </div>

                    {/* Sample video frames */}
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex-1 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-white/10" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Floating stats */}
              <div className="absolute -left-4 top-1/4 hidden lg:block">
                <div className="bg-background/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Check className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">23 clips generated</p>
                      <p className="text-xs text-muted-foreground">in 2 minutes</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-4 top-1/2 hidden lg:block">
                <div className="bg-background/95 backdrop-blur-sm border border-border rounded-xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Wand2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">AI Processing</p>
                      <p className="text-xs text-muted-foreground">Finding best moments</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { value: "8k+", label: "Clips Created", icon: Video },
                { value: "500+", label: "Active Creators", icon: Users },
                { value: "100+", label: "Hours Saved Daily", icon: Clock },
                { value: "4.6/5", label: "User Rating", icon: Star }
              ].map((stat) => (
                <div key={stat.label} className="text-center group">
                  <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 mb-4 group-hover:scale-110 transition-transform">
                    <stat.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              SIMPLE WORKFLOW
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From long-form to viral shorts in just three steps
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: "01",
                title: "Upload Video",
                description: "Upload your long-form content or paste a URL from YouTube, Vimeo, or any platform",
                icon: Upload,
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                step: "02",
                title: "AI Magic",
                description: "Our AI analyzes your content, identifies viral moments, and creates perfectly edited clips",
                icon: Wand2,
                gradient: "from-purple-500 to-pink-500"
              },
              {
                step: "03",
                title: "Export & Share",
                description: "Download clips optimized for TikTok, Reels, Shorts with captions and branding included",
                icon: Download,
                gradient: "from-orange-500 to-red-500"
              }
            ].map((item, index) => (
              <div key={item.step} className="relative">
                {/* Connector line */}
                {index < 2 && (
                  <div className="hidden md:block absolute top-20 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}

                <Card className="relative overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary/20 h-full">
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-5`} />
                  <CardContent className="p-8 text-center relative">
                    <div className={`inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br ${item.gradient} mb-6 shadow-lg`}>
                      <item.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-primary/20 font-bold text-7xl absolute top-4 right-4">
                      {item.step}
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <div className="container relative mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              POWERFUL CAPABILITIES
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Everything You Need to
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent pb-2">
                Create Amazing Content
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional-grade tools powered by cutting-edge AI technology
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const gradients = [
                "from-blue-500 to-cyan-500",
                "from-purple-500 to-pink-500",
                "from-orange-500 to-red-500",
                "from-green-500 to-emerald-500",
                "from-indigo-500 to-purple-500",
                "from-amber-500 to-orange-500"
              ];
              return (
                <Card key={feature.title} className="relative overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-primary/20 group">
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradients[index]} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  <CardContent className="p-6 relative">
                    <div className={`inline-flex items-center justify-center h-14 w-14 rounded-xl bg-gradient-to-br ${gradients[index]} mb-4 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/30" />
        <div className="container relative mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              TESTIMONIALS
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Loved by
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Thousands of Creators
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">See what our users are saying</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={testimonial.name} className="relative shadow-lg hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/20 group overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500" />
                <CardContent className="p-6 relative">
                  {/* Avatar Circle */}
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={`/avatars/avatar${(index % 4) + 1}.png`}
                      alt={testimonial.name}
                      className="h-12 w-12 rounded-full object-cover shadow-md ring-2 ring-primary/20"
                    />
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>

                  {/* Quote */}
                  <div className="relative">
                    <div className="absolute -top-2 -left-2 text-6xl text-primary/10 font-serif">"</div>
                    <p className="text-sm leading-relaxed relative z-10 italic">{testimonial.content}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-accent/5 to-background" />
        <div className="container relative mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              PRICING
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Simple, Transparent
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent pb-2">
                Pricing Plans
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">Choose the plan that fits your needs</p>
          </div>
          <div className="max-w-6xl mx-auto">
            <PricingPlans onUpgrade={handleUpgrade} />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-background to-muted/30" />
        <div className="container relative mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              FAQ
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Got Questions?
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                We've Got Answers
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">Everything you need to know about NebulaAI</p>
          </div>
          <div className="max-w-3xl mx-auto">
            <Card className="shadow-lg border-2">
              <CardContent className="p-6">
                <Accordion type="single" collapsible>
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border-b last:border-0">
                      <AccordionTrigger className="text-left text-lg font-semibold hover:text-primary transition-colors py-6">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="relative max-w-6xl mx-auto">
            {/* Glow effect behind card */}
            <div className="absolute -inset-8 bg-gradient-to-r from-primary via-accent to-primary rounded-3xl blur-3xl opacity-20 animate-pulse" />

            <Card className="relative overflow-hidden shadow-2xl border-2 border-primary/20">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary animate-gradient-shift" />

              {/* Grid pattern overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.1)_1px,transparent_1px)] bg-[size:64px_64px]" />

              <CardContent className="relative p-12 md:p-20 text-center">
                {/* Badge */}
                <div className="inline-block mb-6">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-semibold border border-white/30">
                    <Sparkles className="h-4 w-4" />
                    Start Your Free Trial Today
                  </span>
                </div>

                {/* Heading */}
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                  Ready to Transform
                  <span className="block">Your Content?</span>
                </h2>

                {/* Description */}
                <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
                  Join thousands of creators who are already making viral content with NebulaAI
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/login">
                    <Button size="lg" variant="secondary" className="text-lg h-16 px-10 font-semibold shadow-2xl hover:scale-105 transition-transform">
                      <Sparkles className="h-5 w-5 mr-2" />
                      Start Creating Now
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="text-lg h-16 px-10 font-semibold bg-white/10 border-2 border-white/30 text-white hover:bg-white/25 hover:border-white/60 backdrop-blur-sm transition-all">
                    <Video className="h-5 w-5 mr-2" />
                    Watch Demo
                  </Button>
                </div>

                {/* Trust indicators */}
                <div className="flex flex-wrap items-center justify-center gap-8 mt-12 text-white/80 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    <span>Cancel anytime</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    <span>24/7 support</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
