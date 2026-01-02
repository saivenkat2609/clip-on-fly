import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Chrome, Mail, Shield } from 'lucide-react';

interface AccountLinkingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  email: string;
  existingProvider: 'password' | 'google';
  newProvider: 'password' | 'google';
  loading?: boolean;
  requiresPassword?: boolean;
  onPasswordSubmit?: (password: string) => Promise<void>;
}

export function AccountLinkingModal({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  email,
  existingProvider,
  newProvider,
  loading = false,
  requiresPassword = false,
  onPasswordSubmit
}: AccountLinkingModalProps) {
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleConfirm = async () => {
    if (requiresPassword && onPasswordSubmit) {
      if (!password) {
        setPasswordError('Password is required');
        return;
      }
      try {
        await onPasswordSubmit(password);
      } catch (error) {
        setPasswordError('Incorrect password');
      }
    } else {
      await onConfirm();
    }
  };

  const ProviderIcon = newProvider === 'google' ? Chrome : Mail;
  const providerName = newProvider === 'google' ? 'Google sign-in' : 'password sign-in';
  const existingProviderName = existingProvider === 'google' ? 'Google sign-in' : 'password sign-in';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Link Account Providers
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 text-left">
            <p>
              Your account <strong>{email}</strong> currently uses{' '}
              <span className="font-semibold">{existingProviderName}</span>.
            </p>
            <p>
              Would you like to also enable{' '}
              <span className="font-semibold flex items-center gap-1 inline-flex">
                <ProviderIcon className="h-3 w-3" />
                {providerName}
              </span>?
            </p>
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                After linking, you'll be able to sign in using either method. This provides flexibility and a backup sign-in option.
              </p>
            </div>

            {requiresPassword && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="link-password">Enter your password to confirm</Label>
                <Input
                  id="link-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError('');
                  }}
                  disabled={loading}
                />
                {passwordError && (
                  <p className="text-sm text-red-600">{passwordError}</p>
                )}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={loading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="gradient-primary"
          >
            {loading ? 'Linking...' : 'Link Account'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
