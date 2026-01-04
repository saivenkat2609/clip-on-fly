import { Link } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowLeft } from "lucide-react";

export default function ShippingPolicy() {
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
            <CardTitle className="text-3xl font-bold">Delivery & Access Policy</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Last updated: January 4, 2026</p>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Digital Service Delivery</h2>
              <p className="text-muted-foreground leading-relaxed">
                NebulaAI is a cloud-based SaaS (Software as a Service) platform that provides instant digital access to
                video processing services. There are no physical products or traditional shipping involved. All services
                are delivered electronically via our web platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Immediate Access</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Upon successful registration and payment:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Account access is granted immediately</li>
                <li>Subscription benefits are activated instantly</li>
                <li>Credits are added to your account in real-time</li>
                <li>All features become available immediately upon login</li>
                <li>No waiting period or delivery time required</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Video Processing & Delivery</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                When you upload videos for processing:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Processing begins immediately upon upload completion</li>
                <li>Most videos are processed within 2-5 minutes depending on length</li>
                <li>You'll receive real-time notifications when clips are ready</li>
                <li>Processed clips are instantly available for download from your dashboard</li>
                <li>All video files are stored securely in the cloud for 30 days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Download & Export</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Your processed video clips:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Can be downloaded unlimited times during the storage period</li>
                <li>Are available in multiple formats (MP4, 9:16, 16:9, 1:1)</li>
                <li>Include all captions, effects, and customizations applied</li>
                <li>Can be directly posted to social media platforms via integrations</li>
                <li>Download speeds depend on your internet connection</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Service Availability</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our platform is available 24/7 with a 99.9% uptime guarantee. In rare cases of scheduled maintenance
                or unexpected service disruptions, we will notify users in advance via email and dashboard notifications.
                During maintenance windows, upload and processing features may be temporarily unavailable.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Geographic Restrictions</h2>
              <p className="text-muted-foreground leading-relaxed">
                NebulaAI is accessible globally from any location with internet access. There are no geographic
                shipping restrictions since all services are delivered digitally. However, payment processing
                availability may vary by country based on our payment provider's supported regions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. File Storage & Retention</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                File storage policy:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Original uploaded videos: Stored for 30 days after upload</li>
                <li>Processed clips: Stored for 30 days after processing completion</li>
                <li>Account data: Retained as long as your account is active</li>
                <li>After deletion: Files are permanently removed within 7 business days</li>
                <li>Premium users may have extended storage options</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Failed Processing</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                If video processing fails:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>You'll receive an immediate notification with error details</li>
                <li>Credits used for failed processing are automatically refunded</li>
                <li>You can retry processing at no additional cost</li>
                <li>Our support team is available to assist with technical issues</li>
                <li>Refunds for recurring issues are processed per our Refund Policy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. API & Integration Delivery</h2>
              <p className="text-muted-foreground leading-relaxed">
                For users utilizing our API or third-party integrations, processed videos are delivered via webhook
                notifications and secure download URLs. API responses include direct links to processed files with
                24-hour expiration for security. Permanent storage links are available through the dashboard.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Technical Requirements</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                To access our services, you need:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>A modern web browser (Chrome, Firefox, Safari, Edge)</li>
                <li>Stable internet connection (minimum 5 Mbps recommended)</li>
                <li>JavaScript enabled in your browser</li>
                <li>Cookies enabled for authentication</li>
                <li>Sufficient bandwidth for video uploads and downloads</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Contact Support</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you experience any issues with service delivery, access, or downloads, please contact our support
                team at <a href="mailto:nebulaai.help@gmail.com" className="text-primary hover:underline">nebulaai.help@gmail.com</a>.
                We typically respond within 24 hours during business days and provide 24/7 emergency support for critical issues.
              </p>
            </section>

            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This policy applies to digital service delivery only. NebulaAI does not sell,
                ship, or deliver any physical products. All features, services, and content are provided electronically
                through our cloud-based platform.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
