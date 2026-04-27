import { Link } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLogo } from "@/components/AppLogo";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPolicy() {
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
              <h2 className="text-xl font-semibold mb-3">8. YouTube API Services and Google User Data</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our Service uses YouTube API Services to enable you to upload your edited video clips directly to your YouTube channel.
                This section provides comprehensive disclosure of how we access, use, store, share, and protect Google user data in compliance with the{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google API Services User Data Policy
                </a>.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-4">8.1 Data Accessed: Types of Google User Data We Collect</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                When you choose to connect your YouTube account to our Service, we request and access the following specific types of Google user data:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>
                  <strong>OAuth Access Token:</strong> A temporary authorization token that allows our application to act on your behalf when uploading videos to your YouTube channel. This token is issued by Google and expires after a limited time.
                </li>
                <li>
                  <strong>OAuth Refresh Token:</strong> A long-lived token that allows us to automatically refresh your access token without requiring you to re-authorize our application each time the access token expires.
                </li>
                <li>
                  <strong>YouTube Channel ID:</strong> Your unique YouTube channel identifier (e.g., "UCxxxxxxxxxxxxxx") used to identify which channel to upload videos to.
                </li>
                <li>
                  <strong>YouTube Channel Name:</strong> Your channel's public display name (e.g., "John's Tech Channel") shown in our application interface so you can confirm which account is connected.
                </li>
                <li>
                  <strong>YouTube Channel Profile Picture:</strong> Your channel's profile/thumbnail image URL, displayed in our interface for account identification.
                </li>
                <li>
                  <strong>YouTube Channel Metadata:</strong> Basic channel information retrieved from YouTube API to verify account status and permissions.
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                <strong>Scopes Requested:</strong> We request the following YouTube API scopes:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li><code className="text-sm bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">https://www.googleapis.com/auth/youtube.upload</code> - Permission to upload videos to your YouTube channel</li>
                <li><code className="text-sm bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">https://www.googleapis.com/auth/youtube.force-ssl</code> - Permission to manage video metadata (titles, descriptions, tags, privacy settings)</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                <strong>What We Do NOT Access:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>We do not access, read, modify, or delete any of your existing YouTube videos</li>
                <li>We do not access your video analytics, comments, or engagement data</li>
                <li>We do not access your YouTube watch history, subscriptions, or playlists</li>
                <li>We do not access any other Google services beyond YouTube (Gmail, Drive, Calendar, etc.)</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">8.2 Data Usage: How We Use Your Google User Data</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We use your Google user data exclusively for the following purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>
                  <strong>Video Upload Service:</strong> When you click "Post to YouTube" within our application, we use your OAuth access token to upload the video clip you created and approved to your YouTube channel. This is the primary and sole purpose of accessing your YouTube data.
                </li>
                <li>
                  <strong>Account Connection Display:</strong> We display your YouTube channel name and profile picture in our application's settings/dashboard so you can see which YouTube account is currently connected and verify the connection status.
                </li>
                <li>
                  <strong>Video Metadata Customization:</strong> We allow you to specify custom video titles, descriptions, tags, category, and privacy settings before uploading. We use the YouTube API to apply these settings to your uploaded video.
                </li>
                <li>
                  <strong>Token Refresh:</strong> We use your refresh token to automatically obtain new access tokens when they expire, ensuring seamless video uploads without requiring you to re-authenticate frequently.
                </li>
                <li>
                  <strong>Connection Status Verification:</strong> We periodically verify that your YouTube connection is active and valid to provide accurate status information in our interface.
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                <strong>User Control and Explicit Authorization:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>All video uploads require explicit user action - you must click "Post to YouTube" for each upload</li>
                <li>We never upload content automatically or in the background without your knowledge</li>
                <li>You review and approve video content, title, description, and all metadata before each upload</li>
                <li>You maintain full ownership and control of all content uploaded to your YouTube channel</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                <strong>Strict Limitations on Use:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>We will NEVER access, modify, or delete any existing videos on your YouTube channel</li>
                <li>We will NEVER upload any content without your explicit authorization</li>
                <li>We will NEVER use your YouTube data for advertising, marketing, or promotional purposes</li>
                <li>We will NEVER use your YouTube data to train machine learning models or AI systems</li>
                <li>We will NEVER sell, rent, or monetize your YouTube data in any way</li>
                <li>We will NEVER use your YouTube data for any purpose other than the video upload functionality you explicitly requested</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">8.3 Data Sharing: Third-Party Access to Your Google User Data</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We do not sell or share your Google user data with third parties for advertising, marketing, or any commercial purposes. However, your YouTube data may be accessed by the following service providers solely to deliver the functionality you requested:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>
                  <strong>Google/YouTube:</strong> Your OAuth tokens are sent to Google's servers to authenticate API requests when uploading videos. Video content and metadata are transmitted directly to YouTube's servers. This is necessary to provide the core upload functionality.
                </li>
                <li>
                  <strong>Google Cloud Platform / Firebase:</strong> Your encrypted OAuth tokens and YouTube channel information are stored in Google's Firestore database (part of Firebase). Firebase Cloud Functions process your upload requests. Google is bound by their own data protection policies.
                </li>
                <li>
                  <strong>Cloudflare R2:</strong> Your video files are temporarily stored in Cloudflare R2 cloud storage before being uploaded to YouTube. Cloudflare R2 only stores the video content, not your YouTube authentication data.
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                <strong>No Other Third-Party Sharing:</strong> We do not share your YouTube OAuth tokens, channel information, or any Google user data with:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Advertising networks or data brokers</li>
                <li>Analytics companies (we may track upload success/failure rates but do not share your identity or tokens)</li>
                <li>Other users of our Service</li>
                <li>Any third-party applications or services beyond those listed above</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                <strong>Legal Disclosure:</strong> We may disclose your data if required by law, court order, or government regulation, but we will make reasonable efforts to notify you unless legally prohibited.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-4">8.4 Data Storage & Protection: Security Measures for Your YouTube Data</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We implement industry-standard security measures to protect your Google user data:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>
                  <strong>Encryption at Rest:</strong> Your YouTube OAuth access tokens and refresh tokens are encrypted using AES-256 encryption before being stored in our Firestore database. We use a secure encryption key stored separately from the data itself, managed via Firebase Functions configuration.
                </li>
                <li>
                  <strong>Encryption in Transit:</strong> All communication between your browser, our servers, and Google/YouTube APIs uses TLS/HTTPS encryption to prevent interception of your authentication credentials and video data.
                </li>
                <li>
                  <strong>Access Controls:</strong> Your YouTube connection data is protected by Firebase Firestore security rules that ensure only you (the authenticated user) can read or modify your own YouTube connection information. No other users can access your tokens or channel data.
                </li>
                <li>
                  <strong>Minimal Data Storage:</strong> We only store the minimum data necessary to provide the upload functionality: OAuth tokens, channel ID, channel name, and profile picture URL. We do NOT store copies of your uploaded videos - they are streamed directly from Cloudflare R2 to YouTube.
                </li>
                <li>
                  <strong>Secure Infrastructure:</strong> We use Google Cloud Platform's Firebase services, which provide enterprise-grade security, regular security audits, and compliance with industry standards (SOC 2, ISO 27001).
                </li>
                <li>
                  <strong>Token Expiration:</strong> OAuth access tokens automatically expire after 1 hour, limiting the window of potential misuse. Refresh tokens are used to obtain new access tokens as needed.
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                <strong>Storage Location:</strong> Your YouTube connection data is stored in Google Cloud Firestore, hosted in data centers in the United States (or the region configured for your Firebase project).
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong>Data Isolation:</strong> Each user's YouTube connection data is stored separately with unique user identifiers, ensuring complete isolation between different users' accounts.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                <strong>Security Limitations:</strong> While we implement strong security measures, no method of electronic storage or transmission over the internet is 100% secure. We cannot guarantee absolute security, but we continuously monitor and improve our security practices.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-4">8.5 Data Retention & Deletion: How Long We Keep Your YouTube Data</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                <strong>Retention Policy:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>
                  <strong>Active Connection:</strong> Your YouTube OAuth tokens and channel information are retained for as long as your YouTube account remains connected to our Service and your Clip on Fly account is active. This allows seamless video uploads without repeated authorization.
                </li>
                <li>
                  <strong>Connection Timestamp:</strong> We store the date you connected your YouTube account and the date you last used the upload feature for informational purposes.
                </li>
                <li>
                  <strong>No Long-Term Video Storage:</strong> We do NOT retain copies of videos you upload to YouTube. Videos are temporarily downloaded from Cloudflare R2 during the upload process and immediately discarded after successful upload to YouTube.
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                <strong>Automatic Deletion Triggers:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>When you manually disconnect your YouTube account from our Service</li>
                <li>When you delete your entire Clip on Fly account</li>
                <li>When your OAuth refresh token becomes invalid (e.g., you revoked access via Google Account settings)</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                <strong>Deletion Process - You Can Delete Your Data Anytime:</strong>
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                <li>
                  <strong>Option 1 - Disconnect YouTube Within Our App:</strong> Navigate to Settings → Connected Accounts → Disconnect YouTube. This immediately deletes all YouTube OAuth tokens, channel information, and connection data from our database within seconds.
                </li>
                <li>
                  <strong>Option 2 - Revoke Access via Google:</strong> Visit{' '}
                  <a
                    href="https://myaccount.google.com/permissions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Google Account Permissions
                  </a>{' '}
                  and remove "Clip on Fly" access. This immediately invalidates all tokens, and we will detect this and automatically clean up your connection data within 24 hours.
                </li>
                <li>
                  <strong>Option 3 - Delete Your Clip on Fly Account:</strong> Deleting your account triggers deletion of all associated data, including YouTube connections, within 30 days (with immediate token invalidation).
                </li>
                <li>
                  <strong>Option 4 - Contact Us:</strong> Email us at cliponfly.help@gmail.com with the subject line "Delete YouTube Data" and we will manually delete your YouTube connection data within 7 business days and confirm deletion via email.
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                <strong>What Happens After Deletion:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>All OAuth access tokens and refresh tokens are permanently deleted from our database</li>
                <li>Your YouTube channel name, channel ID, and profile picture are removed from our system</li>
                <li>We can no longer upload videos to your YouTube channel</li>
                <li>Videos previously uploaded to your YouTube channel remain on YouTube (you retain full ownership and can manage them via YouTube Studio)</li>
                <li>You can reconnect your YouTube account at any time by going through the authorization process again</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                <strong>Backup and Logs:</strong> Deleted data may persist in system backups for up to 30 days, after which all backups containing your YouTube data are permanently purged. We do not retain any YouTube OAuth tokens in logs or analytics systems.
              </p>

              <h3 className="text-lg font-semibold mb-2 mt-4">8.6 YouTube API Limited Use Disclosure</h3>
              <p className="text-muted-foreground leading-relaxed">
                Clip on Fly's use and transfer to any other app of information received from Google APIs will adhere to the{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google API Services User Data Policy
                </a>, including the Limited Use requirements. This means:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4 mt-2">
                <li>We only use YouTube data to provide and improve our video upload feature that you explicitly requested</li>
                <li>We do not transfer YouTube data to third parties except as necessary to provide or improve user-facing features (as described in section 8.3)</li>
                <li>We do not use YouTube data for serving advertisements</li>
                <li>We do not allow humans to read your YouTube data unless necessary for security purposes, to comply with applicable law, or with your explicit consent</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">8.7 Your Rights Regarding YouTube Data</h3>
              <p className="text-muted-foreground leading-relaxed mb-2">
                You have the following rights regarding your YouTube data:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li><strong>Right to Access:</strong> You can view your connected YouTube account information in your account settings at any time</li>
                <li><strong>Right to Disconnect:</strong> You can disconnect your YouTube account at any time, immediately revoking our access</li>
                <li><strong>Right to Deletion:</strong> You can request deletion of all YouTube-related data as described in section 8.5</li>
                <li><strong>Right to Know:</strong> You can request information about what YouTube data we store by emailing cliponfly.help@gmail.com</li>
                <li><strong>Right to Revoke:</strong> You can revoke our access via Google Account settings at any time</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2 mt-4">8.8 YouTube Terms of Service</h3>
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
