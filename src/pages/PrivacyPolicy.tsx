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
            <span className="text-xl font-bold">Clip on Fly</span>
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
              <h2 className="text-xl font-semibold mb-3">8. YouTube API Services and Data Usage</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Our Service uses YouTube API Services to enable you to upload your edited video clips directly to your YouTube channel.
                This section explains what YouTube data we access, how we use it, and your rights regarding this data.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-4">8.1 YouTube Data We Access</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                When you connect your YouTube account, we request access to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li><strong>YouTube Channel Information:</strong> Your channel name, profile picture, and basic account details to display in our interface</li>
                <li><strong>Video Upload Permission:</strong> The ability to upload videos to your channel on your behalf when you explicitly click "Post to YouTube"</li>
                <li><strong>Video Metadata:</strong> To set video titles, descriptions, tags, and privacy settings you specify</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">8.2 How We Use YouTube Data</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We use your YouTube data <strong>exclusively</strong> to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Upload video clips that you create and approve within our Service to your YouTube channel</li>
                <li>Display your YouTube channel information in your account settings</li>
                <li>Allow you to customize video metadata (title, description, tags) before publishing</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                <strong>We will NEVER:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Access, modify, or delete any existing videos on your YouTube channel</li>
                <li>Upload any content without your explicit authorization (clicking "Post to YouTube")</li>
                <li>Share your YouTube data with third parties for advertising or marketing</li>
                <li>Use your YouTube data for any purpose other than the video upload functionality you requested</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">8.3 YouTube API Limited Use Disclosure</h3>
              <p className="text-muted-foreground leading-relaxed">
                Clip on Fly's use and transfer to any other app of information received from Google APIs will adhere to the{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google API Services User Data Policy
                </a>, including the Limited Use requirements. We only use YouTube data to provide and improve our video upload feature,
                and we do not transfer YouTube data to third parties except as necessary to provide or improve user-facing features.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-4">8.4 YouTube Data Storage and Retention</h3>
              <p className="text-muted-foreground leading-relaxed">
                We store your YouTube OAuth access tokens securely in encrypted format to maintain your connection to YouTube.
                These tokens are only used when you explicitly request to upload a video. We do not store copies of videos
                you upload to YouTube through our Service - they go directly from our servers to YouTube.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Your YouTube connection data (access tokens and channel information) is retained for as long as your account
                is active or until you disconnect your YouTube account. You can revoke our access at any time.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-4">8.5 Revoking YouTube Access</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                You can revoke Clip on Fly's access to your YouTube account at any time by:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li><strong>Within Clip on Fly:</strong> Go to Settings → Connected Accounts → Disconnect YouTube</li>
                <li><strong>Google Security Settings:</strong> Visit{' '}
                  <a
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google Account Permissions
                  </a>{' '}
                  and remove Clip on Fly access
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                After revoking access, we will immediately delete all YouTube-related data associated with your account,
                including access tokens and channel information.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-4">8.6 YouTube Terms of Service</h3>
              <p className="text-muted-foreground leading-relaxed">
                By using our YouTube integration feature, you also agree to be bound by the{' '}
                <a
                  href="https://www.youtube.com/t/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  YouTube Terms of Service
                </a>{' '}
                and{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google Privacy Policy
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                Beyond YouTube, our Service integrates with other third-party services including Google Authentication,
                payment processors (Razorpay), and cloud storage providers (AWS, Cloudflare). These services have their own
                privacy policies, and we encourage you to review them.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information may be transferred to and processed in countries other than your country of residence.
                We ensure appropriate safeguards are in place to protect your data in compliance with applicable laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Service is not intended for users under 18 years of age. We do not knowingly collect personal
                information from children. If you become aware that a child has provided us with personal information,
                please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy periodically. We will notify you of significant changes via email or
                through a notice on our Service. Your continued use after changes indicates acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">13. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, please contact us at:
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
