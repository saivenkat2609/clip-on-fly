import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Wand2,
  Scissors,
  Type,
  Palette,
  Video,
  Clock,
  Sparkles,
  Zap,
  Target,
  Globe,
  Shield,
  Users
} from "lucide-react";

const mainFeatures = [
  {
    icon: Wand2,
    title: "AI-Powered Highlights",
    description: "Automatically detect the most engaging moments in your long-form content",
    details: "Our advanced AI analyzes speech patterns, engagement hooks, emotional peaks, and visual dynamics to identify the most compelling moments that will resonate with your audience."
  },
  {
    icon: Scissors,
    title: "Smart Editing",
    description: "Intelligent cuts, transitions, and pacing optimized for short-form platforms",
    details: "Get professional-quality edits with AI-powered pacing, smooth transitions, and optimal clip lengths designed specifically for TikTok, Instagram Reels, and YouTube Shorts."
  },
  {
    icon: Type,
    title: "Auto Captions",
    description: "Generate stylish, accurate captions with customizable fonts and colors",
    details: "Add eye-catching captions automatically with high accuracy. Customize fonts, colors, positioning, and animations to match your brand style and increase engagement."
  },
  {
    icon: Palette,
    title: "Brand Templates",
    description: "Apply professional templates that match your brand identity",
    details: "Choose from a library of professionally designed templates or create your own. Save your brand colors, fonts, and layouts for consistent, on-brand content every time."
  },
  {
    icon: Video,
    title: "Multi-Format Export",
    description: "Export in 9:16, 16:9, or 1:1 aspect ratios for any platform",
    details: "One video, multiple formats. Export your clips optimized for Instagram Stories, YouTube, TikTok, LinkedIn, and more - all with a single click."
  },
  {
    icon: Clock,
    title: "Batch Processing",
    description: "Process multiple videos simultaneously to save time",
    details: "Upload and process multiple videos at once. Generate dozens of clips from your content library in minutes instead of hours."
  }
];

const additionalFeatures = [
  {
    icon: Zap,
    title: "Virality Score",
    description: "AI-powered analysis predicts which clips have the highest potential for engagement and viral success."
  },
  {
    icon: Target,
    title: "Hook Detection",
    description: "Identify and optimize attention-grabbing hooks that stop the scroll and maximize viewer retention."
  },
  {
    icon: Globe,
    title: "Multi-Language Support",
    description: "Generate captions and process content in multiple languages with accurate transcription."
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your content is encrypted and secure. We never share or use your videos for training."
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Work together with team members, share projects, and streamline your content workflow."
  },
  {
    icon: Sparkles,
    title: "Premium Quality",
    description: "Export in up to 4K resolution with no watermarks on paid plans for professional results."
  }
];

export default function Features() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent shadow-sm">
                <Video className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ReframeAI
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost">Home</Button>
              </Link>
              <Link to="/login">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Powerful Features for Content Creators
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Everything you need to transform long-form content into viral short clips with AI-powered automation
            </p>
            <Link to="/login">
              <Button size="lg" className="gradient-primary">
                <Sparkles className="mr-2 h-5 w-5" />
                Start Creating Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Core Features</h2>
            <p className="text-xl text-muted-foreground">
              AI-powered tools that do the heavy lifting for you
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {mainFeatures.map((feature) => (
              <Card key={feature.title} className="shadow-medium hover:shadow-large transition-all duration-300 group border-border/50 hover:border-primary/50">
                <CardContent className="p-6">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 w-fit mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                  <p className="text-sm text-muted-foreground/80 leading-relaxed">{feature.details}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Section */}
      <section className="py-20 bg-gradient-to-b from-background to-primary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">More Features</h2>
            <p className="text-xl text-muted-foreground">
              Additional tools to enhance your content creation workflow
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {additionalFeatures.map((feature) => (
              <Card key={feature.title} className="shadow-medium hover:shadow-large transition-all duration-300 border-border/50 hover:border-primary/30">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
              Ready to Create Amazing Content?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Join thousands of content creators who are already using ReframeAI to grow their audience
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Get Started Free
                </Button>
              </Link>
              <Link to="/">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
