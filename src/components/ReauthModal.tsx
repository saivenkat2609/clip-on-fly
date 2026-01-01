/**
 * HIGH PRIORITY FIX #23: Re-authentication Modal Component
 *
 * Modal dialog for requesting user password re-authentication before
 * sensitive actions (account deletion, password change, email change, etc.)
 *
 * Security benefits:
 * - Prevents unauthorized actions if user leaves device unattended
 * - Ensures user identity before critical operations
 * - Complies with security best practices for sensitive actions
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, AlertCircle } from 'lucide-react';

export interface ReauthModalProps {
  open: boolean;
  onClose: () => void;
  onReauth: (password: string) => Promise<boolean>;
  action: string;
  providerType: 'password' | 'google';
}

export function ReauthModal({ open, onClose, onReauth, action, providerType }: ReauthModalProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setPassword('');
      setError(null);
      setLoading(false);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password.trim()) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await onReauth(password);

      if (success) {
        // Close modal on success
        onClose();
      } else {
        setError('Incorrect password. Please try again.');
      }
    } catch (err: any) {
      // Handle specific Firebase error codes
      if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else if (err.code === 'auth/user-mismatch') {
        setError('Authentication failed. Please try signing in again.');
      } else {
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
              <Lock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <DialogTitle>Confirm Your Identity</DialogTitle>
              <DialogDescription className="mt-1">
                {providerType === 'password'
                  ? 'Please enter your password to continue'
                  : 'Please re-authenticate with Google to continue'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {providerType === 'password' ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  For your security, we need to verify your identity before proceeding with: <strong>{action}</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoFocus
                  className="w-full"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Confirm'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          // Google re-auth (handled by popup)
          <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                For your security, we need to verify your identity before proceeding with: <strong>{action}</strong>
              </AlertDescription>
            </Alert>

            <p className="text-sm text-muted-foreground">
              You will be redirected to Google to re-authenticate. This helps protect your account from unauthorized changes.
            </p>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setLoading(true);
                  setError(null);
                  try {
                    const success = await onReauth('');
                    if (success) {
                      onClose();
                    } else {
                      setError('Google authentication failed. Please try again.');
                    }
                  } catch (err) {
                    setError('Authentication failed. Please try again.');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Continue with Google'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
