import { Link } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { AppLogo } from "@/components/AppLogo";
import { Sparkles, ArrowLeft, Zap, Users, Target, Heart } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <AppLogo />
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20 mb-4">
            <Sparkles className="h-4 w-4" />
            Our Story
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Built for Creators,
            <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent pb-2">
              By Creators
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Clip on Fly was born from a simple frustration — spending hours manually cutting long videos into short clips. We built the tool we wished existed.
          </p>
        </div>

        {/* Mission */}
        <Card className="shadow-large mb-8">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-3">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              We believe every creator deserves access to professional-grade video editing without needing a team or technical expertise. Our AI finds the moments that matter, so you can focus on creating more — not editing more.
            </p>
          </CardContent>
        </Card>

        {/* Values */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          {[
            { icon: Zap, title: "Speed First", desc: "What takes hours manually takes minutes with Clip on Fly. Time is your most valuable resource." },
            { icon: Target, title: "Quality Over Quantity", desc: "Our AI doesn't just clip randomly — it identifies genuinely engaging moments that perform." },
            { icon: Users, title: "Creator-Centric", desc: "Every feature we build starts with one question: does this make creators' lives easier?" },
            { icon: Heart, title: "Built with Care", desc: "We're a small team that genuinely cares about the product and the community we serve." },
          ].map((v) => (
            <Card key={v.title} className="shadow-soft">
              <CardContent className="p-6 flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <v.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <Card className="shadow-large mb-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-8">
            <div className="grid grid-cols-3 gap-6 text-center">
              {[
                { value: "8k+", label: "Clips Generated" },
                { value: "500+", label: "Active Creators" },
                { value: "100+", label: "Hours Saved Daily" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">{s.value}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <Card className="shadow-soft">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-bold mb-2">Want to get in touch?</h2>
            <p className="text-muted-foreground mb-4 text-sm">We'd love to hear from you — feedback, questions, or just to say hi.</p>
            <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              Contact Us
            </Link>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
