import { Link } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLogo } from "@/components/AppLogo";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CookiePolicy() {
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
            <CardTitle className="text-3xl font-bold">Cookie Policy</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Last updated: January 1, 2026</p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. What Are Cookies?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files stored on your device when you visit our website. They help us provide you
                with a better experience by remembering your preferences and understanding how you use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Types of Cookies We Use</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Essential Cookies</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    These cookies are necessary for the Service to function properly. They enable core functionality such as
                    security, authentication, and session management.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                    <li>Authentication tokens</li>
                    <li>Session management</li>
                    <li>Security features</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Analytics Cookies</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    These cookies help us understand how visitors interact with our Service by collecting and reporting
                    information anonymously.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                    <li>Google Analytics</li>
                    <li>Usage statistics</li>
                    <li>Performance monitoring</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Functionality Cookies</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    These cookies allow the Service to remember choices you make and provide enhanced features.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                    <li>Theme preferences (light/dark mode)</li>
                    <li>Language settings</li>
                    <li>Remember me functionality</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Third-Party Cookies</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Some cookies are placed by third-party services that appear on our pages:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                    <li>Google Authentication</li>
                    <li>Razorpay Payment Gateway</li>
                    <li>YouTube API</li>
                    <li>Firebase Services</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. How We Use Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We use cookies to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Keep you signed in during your session</li>
                <li>Remember your preferences and settings</li>
                <li>Understand how you use our Service</li>
                <li>Improve our Service based on usage data</li>
                <li>Provide personalized content and features</li>
                <li>Secure your account and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Managing Cookies</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                You can control and manage cookies in several ways:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Most browsers allow you to refuse or accept cookies</li>
                <li>You can delete cookies already stored on your device</li>
                <li>You can set your browser to notify you when cookies are sent</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Please note that blocking or deleting cookies may impact your experience and some features may not work properly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Browser-Specific Cookie Management</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Instructions for managing cookies in popular browsers:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Chrome: Settings → Privacy and security → Cookies and other site data</li>
                <li>Firefox: Settings → Privacy & Security → Cookies and Site Data</li>
                <li>Safari: Preferences → Privacy → Manage Website Data</li>
                <li>Edge: Settings → Privacy, search and services → Cookies and site permissions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Cookie Duration</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use both session cookies (deleted when you close your browser) and persistent cookies (remain on your
                device for a set period). Essential cookies typically expire after 7 days, while preference cookies may
                last up to 1 year.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Do Not Track Signals</h2>
              <p className="text-muted-foreground leading-relaxed">
                Some browsers include a "Do Not Track" feature. Currently, there is no industry standard for how to respond
                to these signals. We do not alter our data collection practices when we receive a Do Not Track signal.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Updates to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated
                revision date. We encourage you to review this policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about our use of cookies, please contact us at:
              </p>
              <p className="text-muted-foreground mt-2">
                Email: cliponfly.help@gmail.com<br />
                Address: Clip on Fly Privacy Team
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
