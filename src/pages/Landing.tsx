import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Link } from "react-router-dom";
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
  Check
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

const pricingTiers = [
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
    popular: true
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
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">ClipForge</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link to="/dashboard">
                <Button className="gradient-primary">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-clip-text text-transparent gradient-hero">
            Transform Long Videos Into Viral Clips
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI-powered video repurposing that turns your content into engaging short-form videos in minutes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/dashboard">
              <Button size="lg" className="gradient-primary shadow-glow text-lg h-14 px-8">
                Start Creating Free
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg h-14 px-8">
              Watch Demo
            </Button>
          </div>
          
          {/* Upload Preview Box */}
          <Card className="max-w-2xl mx-auto shadow-large">
            <CardContent className="p-8">
              <div className="border-2 border-dashed border-border rounded-lg p-12 bg-muted/30 hover:bg-muted/50 transition-smooth cursor-pointer group">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground group-hover:text-primary transition-smooth" />
                <p className="text-lg font-medium mb-2">Drop your video here</p>
                <p className="text-sm text-muted-foreground">or click to browse files</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">Three simple steps to viral content</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { step: "01", title: "Upload Video", description: "Drop your long-form content or paste a URL", icon: Upload },
              { step: "02", title: "AI Processing", description: "Our AI finds the best moments and creates clips", icon: Wand2 },
              { step: "03", title: "Download & Share", description: "Export optimized clips ready for any platform", icon: Download }
            ].map((item) => (
              <Card key={item.step} className="relative overflow-hidden shadow-medium hover:shadow-large transition-smooth">
                <CardContent className="p-8 text-center">
                  <div className="absolute top-4 right-4 text-6xl font-bold text-primary/10">
                    {item.step}
                  </div>
                  <item.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground">Everything you need to create amazing content</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature) => (
              <Card key={feature.title} className="shadow-medium hover:shadow-large transition-smooth group">
                <CardContent className="p-6">
                  <feature.icon className="h-10 w-10 mb-4 text-primary group-hover:scale-110 transition-smooth" />
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Loved by Creators</h2>
            <p className="text-xl text-muted-foreground">See what our users are saying</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="shadow-medium">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="mb-4 text-sm">&ldquo;{testimonial.content}&rdquo;</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground">Choose the plan that fits your needs</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {pricingTiers.map((tier) => (
              <Card 
                key={tier.name} 
                className={`shadow-medium relative ${tier.popular ? 'border-primary border-2 shadow-glow' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <p className="text-muted-foreground mb-4">{tier.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{tier.price}</span>
                    <span className="text-muted-foreground">{tier.period}</span>
                  </div>
                  <Button className={`w-full mb-6 ${tier.popular ? 'gradient-primary' : ''}`}>
                    Get Started
                  </Button>
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible>
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left text-lg font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="gradient-hero shadow-large">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                Ready to Transform Your Content?
              </h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of creators who are already making viral content with ClipForge
              </p>
              <Link to="/dashboard">
                <Button size="lg" variant="secondary" className="text-lg h-14 px-8">
                  Start Creating Now
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">ClipForge</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered video repurposing for modern creators
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-smooth">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Templates</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-smooth">About</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-smooth">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-smooth">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 ClipForge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
