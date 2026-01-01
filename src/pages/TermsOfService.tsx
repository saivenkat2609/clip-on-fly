import { Link } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="flex items-center gap-2 w-fit">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">NebulaAI</span>
          </Link>
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
            <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Last updated: January 1, 2026</p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using NebulaAI ("the Service"), you accept and agree to be bound by these Terms of Service.
                If you do not agree to these terms, please do not use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                NebulaAI provides AI-powered video editing and repurposing services that transform long-form content into
                optimized short-form videos. We reserve the right to modify, suspend, or discontinue the Service at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                When you create an account, you agree to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Content Ownership and Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                You retain all rights to the content you upload. By using our Service, you grant us a limited license to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Process and analyze your uploaded videos</li>
                <li>Generate edited clips based on your content</li>
                <li>Store your content for the duration of service provision</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                You represent that you own or have the necessary rights to all content you upload.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Upload content that violates copyright, trademark, or other intellectual property rights</li>
                <li>Use the Service for illegal or unauthorized purposes</li>
                <li>Attempt to bypass usage limits or access restrictions</li>
                <li>Upload malicious code or harmful content</li>
                <li>Abuse or harass other users or our support staff</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Subscription and Billing</h2>
              <p className="text-muted-foreground leading-relaxed">
                Subscriptions are billed in advance on a monthly or annual basis. You authorize us to charge your payment
                method for the subscription fees. Prices are subject to change with 30 days notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to suspend or terminate your account if you violate these Terms. You may cancel your
                subscription at any time through your account settings. Upon termination, your access to the Service will cease.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service is provided "as is" without warranties of any kind. We do not guarantee that the Service will be
                uninterrupted, error-free, or meet your specific requirements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                NebulaAI shall not be liable for any indirect, incidental, special, or consequential damages arising from your
                use of the Service. Our total liability shall not exceed the amount you paid for the Service in the past 12 months.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update these Terms from time to time. We will notify you of significant changes via email or through
                the Service. Continued use after changes constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these Terms, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: legal@nebulaai.com<br />
                Address: NebulaAI Legal Department
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
