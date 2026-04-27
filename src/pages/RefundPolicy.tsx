import { Link } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLogo } from "@/components/AppLogo";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RefundPolicy() {
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

        <Card className="shadow-large">
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Refund & Cancellation Policy</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Last updated: January 1, 2026</p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Subscription Cancellation</h2>
              <p className="text-muted-foreground leading-relaxed">
                You may cancel your subscription at any time through your account settings. Upon cancellation:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Your subscription will remain active until the end of your current billing period</li>
                <li>You will retain access to all features until the subscription expires</li>
                <li>No further charges will be made after the current period ends</li>
                <li>You can reactivate your subscription at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Refund Eligibility</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We offer refunds under the following circumstances:
              </p>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">7-Day Money-Back Guarantee</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    New subscribers are eligible for a full refund if they cancel within 7 days of their initial subscription,
                    provided they have:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                    <li>Not exceeded 10% of their monthly video processing limit</li>
                    <li>Not downloaded more than 3 processed videos</li>
                    <li>Not violated our Terms of Service</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Service Issues</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Refunds may be considered if:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                    <li>You experience significant service downtime (more than 72 consecutive hours)</li>
                    <li>Critical features are unavailable for an extended period</li>
                    <li>You were charged incorrectly due to a billing error</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Non-Refundable Items</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                The following are not eligible for refunds:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Partial month or year subscriptions after the 7-day guarantee period</li>
                <li>Subscriptions that have been cancelled mid-billing cycle (you retain access until period end)</li>
                <li>Accounts suspended or terminated due to Terms of Service violations</li>
                <li>Changes in personal circumstances or business needs</li>
                <li>Dissatisfaction with output quality after successful processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. How to Request a Refund</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                To request a refund:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-4">
                <li>Contact our support team at cliponfly.help@gmail.com</li>
                <li>Include your account email and transaction ID</li>
                <li>Provide a brief explanation of your refund request</li>
                <li>Allow 3-5 business days for review</li>
              </ol>
              <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-sm font-semibold text-primary mb-1">
                  Support via email only
                </p>
                <p className="text-xs text-muted-foreground">
                  We provide support exclusively via email with responses within 24–48 hours. For refund requests, please allow an additional 3-5 business days for review.
                </p>
              </div>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Approved refunds will be processed within 7-10 business days to your original payment method.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Subscription Upgrades and Downgrades</h2>

              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Upgrades</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    When you upgrade your subscription, you will be charged a prorated amount for the remainder of your
                    current billing cycle. The new plan takes effect immediately.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Downgrades</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    When you downgrade your subscription, the change takes effect at the start of your next billing cycle.
                    You will continue to have access to your current plan features until then. No prorated refunds are
                    provided for downgrades.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Payment Disputes</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you dispute a charge with your payment provider before contacting us, your account may be suspended
                until the dispute is resolved. We strongly encourage you to contact our support team first to resolve
                any billing issues.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Failed Payments</h2>
              <p className="text-muted-foreground leading-relaxed">
                If your payment fails during renewal:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>We will attempt to charge your payment method up to 3 times</li>
                <li>You will receive email notifications about the failed payment</li>
                <li>Your account will be downgraded to the free plan after failed attempts</li>
                <li>You can update your payment method to reactivate your subscription</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Annual Subscriptions</h2>
              <p className="text-muted-foreground leading-relaxed">
                Annual subscriptions receive a 20% discount compared to monthly billing. The 7-day money-back guarantee
                applies to annual subscriptions. After the guarantee period, annual subscriptions are non-refundable but
                can be cancelled to prevent auto-renewal.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Service Credits</h2>
              <p className="text-muted-foreground leading-relaxed">
                In cases where a refund is not applicable but you experienced service issues, we may offer service credits
                at our discretion. Credits can be applied to future billing periods and do not have cash value.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify this Refund & Cancellation Policy at any time. Changes will be posted on
                this page with an updated date. Your continued use of the Service after changes constitutes acceptance
                of the new policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                For questions about refunds or cancellations, please contact us at:
              </p>
              <p className="text-muted-foreground">
                Email: cliponfly.help@gmail.com<br />
                Address: Clip on Fly Billing Department
              </p>
              <p className="text-sm text-muted-foreground mt-3 italic">
                Support via email only (responses within 24–48 hours)
              </p>
            </section>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
