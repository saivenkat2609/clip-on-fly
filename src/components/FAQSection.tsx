import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, HelpCircle, Zap, Video, Download, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  }
];

export function FAQSection() {
  const [openId, setOpenId] = useState<number | null>(null);

  const toggleFAQ = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start gap-4 pb-2">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-sm">
          <HelpCircle className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
          <p className="text-sm text-muted-foreground mt-1">Everything you need to know about creating clips</p>
        </div>
      </div>

      {/* FAQ Items */}
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <motion.div
            key={faq.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card
              className={`cursor-pointer transition-all duration-300 border hover:shadow-md ${
                openId === faq.id
                  ? "shadow-md border-primary/50 bg-primary/5"
                  : "border-border/50 hover:border-primary/30"
              }`}
              onClick={() => toggleFAQ(faq.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <motion.div
                    className={`p-3 rounded-lg transition-all duration-300 flex-shrink-0 ${
                      openId === faq.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/50 text-muted-foreground"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    {faq.icon}
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-base text-foreground">
                        {faq.question}
                      </h3>
                      <motion.div
                        animate={{ rotate: openId === faq.id ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <ChevronDown
                          className={`h-5 w-5 flex-shrink-0 ${
                            openId === faq.id
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </motion.div>
                    </div>

                    {/* Answer */}
                    <AnimatePresence initial={false}>
                      {openId === faq.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <p className="text-sm text-muted-foreground leading-relaxed pt-3">
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
