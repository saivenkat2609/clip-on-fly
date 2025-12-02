import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, HelpCircle, Zap, Video, Download, Clock } from "lucide-react";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  icon: React.ReactNode;
}

const faqs: FAQItem[] = [
  {
    id: 3,
    question: "How do credits work?",
    answer: "Credits are based on video duration - 1 minute of video = 1 credit. Your plan renews monthly with a fresh allocation. Unused credits don't roll over, so make the most of them each month!",
    icon: <Zap className="h-5 w-5" />
  },
  {
    id: 4,
    question: "Can I download my clips?",
    answer: "Yes! Once processing is complete, you can download individual clips or all clips at once in high quality. Your clips are stored securely and accessible anytime from your project dashboard.",
    icon: <Download className="h-5 w-5" />
  },
  {
    id: 5,
    question: "What makes a clip 'viral'?",
    answer: "Our AI analyzes multiple factors including hook strength, engagement patterns, pacing, trending elements, and emotional impact. Clips with higher virality scores have better potential for social media engagement.",
    icon: <HelpCircle className="h-5 w-5" />
  },
  {
    id: 6,
    question: "Can I edit the generated clips?",
    answer: "Absolutely! Each clip can be customized with different captions, aspect ratios, and trim points. You have full control to fine-tune every clip to match your content style and platform requirements.",
    icon: <Video className="h-5 w-5" />
  }
];

export function FAQSection() {
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleFAQ = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <HelpCircle className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
          <p className="text-sm text-muted-foreground">Everything you need to know about creating clips</p>
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((faq) => (
          <Card
            key={faq.id}
            className={`cursor-pointer transition-all duration-300 border-border/50 hover:border-primary/30 shadow-soft ${
              openId === faq.id ? "shadow-medium border-primary/50" : ""
            }`}
            onClick={() => toggleFAQ(faq.id)}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-lg transition-colors flex-shrink-0 ${
                  openId === faq.id
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {faq.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm leading-snug pr-2">
                      {faq.question}
                    </h3>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform duration-300 flex-shrink-0 ${
                        openId === faq.id ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openId === faq.id ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="text-sm text-muted-foreground leading-relaxed pt-1">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Help CTA */}
      <Card className="mt-6 bg-gradient-to-br from-primary/5 via-accent/5 to-background border-border/50">
        <CardContent className="p-6 text-center">
          <div className="max-w-xl mx-auto space-y-3">
            <h3 className="font-semibold text-lg">Still have questions?</h3>
            <p className="text-sm text-muted-foreground">
              Can't find the answer you're looking for? Our support team is here to help you get the most out of your clips.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <a
                href="mailto:support@yourapp.com"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-sm transition-colors"
              >
                Contact Support
              </a>
              <a
                href="/docs"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg border border-border hover:bg-muted font-medium text-sm transition-colors"
              >
                View Documentation
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
