import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Mail } from 'lucide-react';

export function EmailVerificationBanner() {
  const { currentUser, resendVerificationEmail, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // UI/UX FIX #86: Poll verification status every 30 seconds
  useEffect(() => {
    if (!currentUser || currentUser.emailVerified) return;

    const pollInterval = setInterval(async () => {
      try {
        await refreshUser();
      } catch (error) {
        console.error('Failed to refresh user verification status:', error);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(pollInterval);
  }, [currentUser, refreshUser]);

  // Don't show banner if user is verified or signed in with Google
  if (!currentUser || currentUser.emailVerified) {
    return null;
  }

  // Don't show for Google OAuth users (they're auto-verified)
  if (currentUser.providerData.some(provider => provider.providerId === 'google.com')) {
    return null;
  }

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      await resendVerificationEmail();
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 5000);
    } catch (error: any) {
      console.error('Failed to resend verification email:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setLoading(true);
    try {
      await refreshUser();
      if (currentUser.emailVerified) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950 mb-6">
      <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
      <AlertDescription className="flex items-center justify-between">
        <div className="text-sm text-orange-800 dark:text-orange-200">
          <p className="font-medium">Email verification required</p>
          <p className="text-xs mt-1">
            Please verify your email address to access all features.
            {emailSent && (
              <span className="text-green-600 dark:text-green-400 ml-2">
                ✓ Verification email sent!
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendEmail}
            disabled={loading || emailSent}
          >
            <Mail className="h-3 w-3 mr-1" />
            {emailSent ? 'Sent' : 'Resend'}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleCheckVerification}
            disabled={loading}
          >
            I've verified
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
