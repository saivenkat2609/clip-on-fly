import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LegalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'terms' | 'privacy';
}

export function LegalModal({ open, onOpenChange, type }: LegalModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {type === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
          </DialogTitle>
          <DialogDescription>
            {type === 'terms'
              ? 'Please read our terms of service carefully.'
              : 'Learn how we collect, use, and protect your information.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {type === 'terms' ? <TermsOfServiceContent /> : <PrivacyPolicyContent />}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function TermsOfServiceContent() {
  return (
    <div className="space-y-4 text-sm">
      <section>
        <h3 className="font-semibold text-base mb-2">1. Acceptance of Terms</h3>
        <p className="text-muted-foreground">
          By accessing and using Clip on Fly ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-base mb-2">2. Use License</h3>
        <p className="text-muted-foreground mb-2">
          Permission is granted to temporarily access the Service for personal, non-commercial use only. This is the grant of a license, not a transfer of title, and under this license you may not:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
          <li>Modify or copy the materials</li>
          <li>Use the materials for any commercial purpose or for any public display</li>
          <li>Attempt to reverse engineer any software contained in the Service</li>
          <li>Remove any copyright or other proprietary notations from the materials</li>
          <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-base mb-2">3. User Account</h3>
        <p className="text-muted-foreground">
          To access certain features of the Service, you must register for an account. When you register, you must provide accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-base mb-2">4. Subscription and Payments</h3>
        <p className="text-muted-foreground mb-2">
          Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis (monthly or yearly). Billing cycles are set at the beginning of your subscription.
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
          <li>Subscriptions automatically renew unless cancelled</li>
          <li>Refunds are processed according to our refund policy</li>
          <li>Price changes will be communicated with 30 days notice</li>
          <li>You can cancel your subscription at any time from your account settings</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-base mb-2">5. Content Ownership</h3>
        <p className="text-muted-foreground">
          You retain all rights to the content you upload to the Service. By uploading content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and process your content solely for the purpose of providing the Service to you.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-base mb-2">6. Prohibited Uses</h3>
        <p className="text-muted-foreground mb-2">
          You may not use the Service:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
          <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
          <li>To violate any international, federal, provincial or state regulations, rules, laws, or local ordinances</li>
          <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
          <li>To upload or transmit viruses or any other type of malicious code</li>
          <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-base mb-2">7. Disclaimer</h3>
        <p className="text-muted-foreground">
          The Service is provided on an "as is" and "as available" basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-base mb-2">8. Limitations</h3>
        <p className="text-muted-foreground">
          In no event shall Clip on Fly or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the Service.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-base mb-2">9. Termination</h3>
        <p className="text-muted-foreground">
          We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-base mb-2">10. Changes to Terms</h3>
        <p className="text-muted-foreground">
          We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-base mb-2">11. Contact Us</h3>
        <p className="text-muted-foreground">
          If you have any questions about these Terms, please contact us at cliponfly.help@gmail.com
        </p>
      </section>

      <p className="text-xs text-muted-foreground mt-6">
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  );
}

function PrivacyPolicyContent() {
  return (
    <div className="space-y-4 text-sm">
      <section>
        <h3 className="font-semibold text-base mb-2">1. Information We Collect</h3>
        <p className="text-muted-foreground mb-2">
          We collect information that you provide directly to us, including:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
          <li>Account information (name, email address, password)</li>
          <li>Profile information (display name, profile picture)</li>
          <li>Payment information (processed securely through our payment providers)</li>
          <li>Content you upload to the Service</li>
          <li>Communications with us (support requests, feedback)</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-base mb-2">2. How We Use Your Information</h3>
        <p className="text-muted-foreground mb-2">
          We use the information we collect to:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
          <li>Provide, maintain, and improve our Service</li>
          <li>Process your transactions and send related information</li>
          <li>Send you technical notices, updates, security alerts, and support messages</li>
          <li>Respond to your comments, questions, and customer service requests</li>
          <li>Communicate with you about products, services, offers, and events</li>
          <li>Monitor and analyze trends, usage, and activities in connection with our Service</li>
          <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-base mb-2">3. Information Sharing</h3>
        <p className="text-muted-foreground mb-2">
          We do not sell or rent your personal information. We may share your information in the following circumstances:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
          <li>With service providers who perform services on our behalf</li>
          <li>To comply with legal obligations or respond to legal requests</li>
          <li>To protect the rights, property, or safety of Clip on Fly, our users, or others</li>
          <li>In connection with a merger, acquisition, or sale of assets (with notice to you)</li>
          <li>With your consent or at your direction</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-base mb-2">4. Data Security</h3>
        <p className="text-muted-foreground">
          We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. However, no Internet or email transmission is ever fully secure or error-free.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-base mb-2">5. Data Retention</h3>
        <p className="text-muted-foreground">
          We retain your information for as long as your account is active or as needed to provide you services. We will retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-base mb-2">6. Your Rights</h3>
        <p className="text-muted-foreground mb-2">
          You have the right to:
        </p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
          <li>Access and receive a copy of your personal information</li>
          <li>Correct or update your personal information</li>
          <li>Delete your personal information</li>
          <li>Object to or restrict the processing of your personal information</li>
          <li>Export your data in a portable format</li>
          <li>Withdraw consent where we rely on consent to process your information</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold text-base mb-2">7. Cookies and Tracking</h3>
        <p className="text-muted-foreground">
          We use cookies and similar tracking technologies to collect information about your browsing activities. You can control cookies through your browser settings. However, disabling cookies may limit your ability to use certain features of the Service.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-base mb-2">8. Third-Party Services</h3>
        <p className="text-muted-foreground">
          Our Service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read their privacy policies.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-base mb-2">9. Children's Privacy</h3>
        <p className="text-muted-foreground">
          Our Service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-base mb-2">10. International Data Transfers</h3>
        <p className="text-muted-foreground">
          Your information may be transferred to and maintained on computers located outside of your country where data protection laws may differ. By using the Service, you consent to this transfer.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-base mb-2">11. Changes to Privacy Policy</h3>
        <p className="text-muted-foreground">
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
        </p>
      </section>

      <section>
        <h3 className="font-semibold text-base mb-2">12. Contact Us</h3>
        <p className="text-muted-foreground">
          If you have any questions about this Privacy Policy, please contact us at cliponfly.help@gmail.com
        </p>
      </section>

      <p className="text-xs text-muted-foreground mt-6">
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  );
}
