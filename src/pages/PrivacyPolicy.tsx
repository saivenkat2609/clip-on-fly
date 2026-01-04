import { Link } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
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
            <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Last updated: January 1, 2026</p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Account information (name, email, password)</li>
                <li>Payment information (processed securely through Razorpay)</li>
                <li>Video content you upload for processing</li>
                <li>Usage data and preferences</li>
                <li>Communications with our support team</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We use the collected information to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process your video content and generate clips</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send you service updates and notifications</li>
                <li>Respond to your comments and questions</li>
                <li>Analyze usage patterns to enhance user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Data Storage and Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use industry-standard security measures to protect your data. Your videos are stored securely on
                Cloudflare R2 and are encrypted in transit and at rest. We use Firebase Authentication for secure
                account management. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information and video content for as long as your account is active or as needed
                to provide you services. If you delete your account, your data will be permanently deleted within 30 days,
                except where we are required to retain it by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Information Sharing</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We do not sell your personal information. We may share your information with:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Service providers who assist in operating our platform (AWS, Cloudflare, Firebase)</li>
                <li>Payment processors for billing purposes (Razorpay)</li>
                <li>Legal authorities when required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Your Rights and Choices</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Opt-out of marketing communications</li>
                <li>Request a copy of your data</li>
                <li>Object to certain data processing activities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Cookies and Tracking</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to improve your experience. See our Cookie Policy for
                detailed information about the cookies we use and how to manage them.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service integrates with third-party services including YouTube, Google Authentication, and payment
                processors. These services have their own privacy policies, and we encourage you to review them.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information may be transferred to and processed in countries other than your country of residence.
                We ensure appropriate safeguards are in place to protect your data in compliance with applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service is not intended for users under 18 years of age. We do not knowingly collect personal
                information from children. If you become aware that a child has provided us with personal information,
                please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy periodically. We will notify you of significant changes via email or
                through a notice on our Service. Your continued use after changes indicates acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: nebulaai.help@gmail.com<br />
                Address: NebulaAI Privacy Team
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
