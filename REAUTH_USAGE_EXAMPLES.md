# HIGH PRIORITY FIX #23: Re-authentication Usage Examples

## Overview

The re-authentication system ensures user identity before sensitive actions (account deletion, password changes, email updates, etc.). This document provides examples of how to implement re-auth in your components.

## Setup

### 1. Add ReauthProvider to App Root

Wrap your app with `ReauthProvider` in `App.tsx`:

```typescript
import { ReauthProvider } from '@/hooks/useReauth';

function App() {
  return (
    <ReauthProvider>
      <AuthProvider>
        <ThemeProvider>
          {/* Your app content */}
        </ThemeProvider>
      </AuthProvider>
    </ReauthProvider>
  );
}
```

## Usage Examples

### Example 1: Account Deletion

```typescript
import { useReauth } from '@/hooks/useReauth';
import { deleteUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';

function DeleteAccountButton() {
  const { requestReauth } = useReauth();
  const [loading, setLoading] = useState(false);

  async function handleDeleteAccount() {
    try {
      // Request re-authentication
      const confirmed = await requestReauth('delete your account');

      if (!confirmed) {
        // User cancelled
        console.log('Account deletion cancelled');
        return;
      }

      // User successfully re-authenticated, proceed with deletion
      setLoading(true);

      const user = auth.currentUser;
      if (user) {
        await deleteUser(user);
        toast.success('Account deleted successfully');
        navigate('/');
      }
    } catch (error) {
      console.error('Account deletion failed:', error);
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="destructive"
      onClick={handleDeleteAccount}
      disabled={loading}
    >
      {loading ? 'Deleting...' : 'Delete Account'}
    </Button>
  );
}
```

### Example 2: Password Change

```typescript
import { useReauth } from '@/hooks/useReauth';
import { updatePassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

function ChangePasswordForm() {
  const { requestReauth } = useReauth();
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();

    try {
      // Request re-authentication before changing password
      const confirmed = await requestReauth('change your password');

      if (!confirmed) {
        return;
      }

      // Proceed with password update
      setLoading(true);

      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        toast.success('Password updated successfully');
        setNewPassword('');
      }
    } catch (error: any) {
      if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak');
      } else {
        toast.error('Failed to update password');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handlePasswordChange}>
      <Label>New Password</Label>
      <Input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Change Password'}
      </Button>
    </form>
  );
}
```

### Example 3: Email Change

```typescript
import { useReauth } from '@/hooks/useReauth';
import { updateEmail, sendEmailVerification } from 'firebase/auth';
import { auth } from '@/lib/firebase';

function ChangeEmailForm() {
  const { requestReauth } = useReauth();
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();

    try {
      // Request re-authentication before changing email
      const confirmed = await requestReauth('change your email address');

      if (!confirmed) {
        return;
      }

      setLoading(true);

      const user = auth.currentUser;
      if (user) {
        // Update email
        await updateEmail(user, newEmail);

        // Send verification to new email
        await sendEmailVerification(user);

        toast.success('Email updated! Please verify your new email address.');
        setNewEmail('');
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already in use');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address');
      } else {
        toast.error('Failed to update email');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleEmailChange}>
      <Label>New Email</Label>
      <Input
        type="email"
        value={newEmail}
        onChange={(e) => setNewEmail(e.target.value)}
        required
      />
      <Button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Change Email'}
      </Button>
    </form>
  );
}
```

### Example 4: Subscription Cancellation

```typescript
import { useReauth } from '@/hooks/useReauth';

function CancelSubscriptionButton() {
  const { requestReauth } = useReauth();
  const [loading, setLoading] = useState(false);

  async function handleCancelSubscription() {
    try {
      // Request re-authentication
      const confirmed = await requestReauth('cancel your subscription');

      if (!confirmed) {
        return;
      }

      setLoading(true);

      // Call your API to cancel subscription
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        toast.success('Subscription cancelled successfully');
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      toast.error('Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="destructive"
      onClick={handleCancelSubscription}
      disabled={loading}
    >
      {loading ? 'Cancelling...' : 'Cancel Subscription'}
    </Button>
  );
}
```

### Example 5: Download All Data (GDPR)

```typescript
import { useReauth } from '@/hooks/useReauth';

function DownloadDataButton() {
  const { requestReauth } = useReauth();
  const [loading, setLoading] = useState(false);

  async function handleDownloadData() {
    try {
      // Request re-authentication for data export
      const confirmed = await requestReauth('download your personal data');

      if (!confirmed) {
        return;
      }

      setLoading(true);

      // Call API to generate data export
      const response = await fetch('/api/user/export-data', {
        method: 'POST',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'my-data.zip';
        a.click();

        toast.success('Data downloaded successfully');
      } else {
        throw new Error('Failed to download data');
      }
    } catch (error) {
      toast.error('Failed to download data');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleDownloadData} disabled={loading}>
      {loading ? 'Preparing...' : 'Download My Data'}
    </Button>
  );
}
```

## Sensitive Actions Checklist

Always require re-authentication for:

- ✅ **Account deletion**
- ✅ **Password changes**
- ✅ **Email address changes**
- ✅ **Two-factor authentication setup/changes**
- ✅ **Payment method changes**
- ✅ **Subscription cancellations**
- ✅ **Data exports (GDPR)**
- ✅ **API key generation**
- ✅ **OAuth application authorization**
- ✅ **Security settings changes**

Do NOT require re-authentication for:

- ❌ Profile picture changes
- ❌ Display name changes
- ❌ Notification preferences
- ❌ Theme preferences
- ❌ Language settings
- ❌ Regular content creation/editing

## Timeout Configuration

The re-authentication timeout is configured in `sessionManager.ts`:

```typescript
// User must re-authenticate if last sign-in was more than 30 minutes ago
const SENSITIVE_ACTION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
```

To check if user has recent auth without showing modal:

```typescript
import { hasRecentAuth } from '@/lib/sessionManager';

if (hasRecentAuth()) {
  // User authenticated recently, proceed without re-auth
} else {
  // User needs to re-authenticate
}
```

## Testing

### Test 1: Password Re-authentication

1. Sign in with email/password
2. Wait 31 minutes (or modify timeout for testing)
3. Try to delete account
4. Should see re-auth modal
5. Enter correct password → should proceed
6. Enter wrong password → should show error

### Test 2: Google Re-authentication

1. Sign in with Google
2. Wait 31 minutes
3. Try to change email
4. Should see Google re-auth modal
5. Complete Google auth → should proceed
6. Cancel Google auth → should not proceed

### Test 3: Cancellation

1. Trigger re-auth modal
2. Click "Cancel"
3. Action should not proceed

## Security Benefits

1. **Session Hijacking Protection:** Even if attacker steals session token, they can't perform sensitive actions without password
2. **Idle Session Protection:** User who left device unattended can't have sensitive actions performed
3. **Compliance:** Meets security best practices and regulatory requirements (PCI DSS, GDPR)
4. **User Trust:** Shows users you take security seriously

## Troubleshooting

### Issue: Modal not appearing

**Solution:** Ensure `ReauthProvider` wraps your component tree

```typescript
// App.tsx
<ReauthProvider>
  <YourApp />
</ReauthProvider>
```

### Issue: "useReauth must be used within a ReauthProvider"

**Solution:** Component using `useReauth()` must be a child of `ReauthProvider`

### Issue: Modal closes but action doesn't proceed

**Solution:** Check the return value of `requestReauth()`:

```typescript
const confirmed = await requestReauth('action');
if (!confirmed) {
  return; // User cancelled or auth failed
}
// Proceed with action
```

### Issue: Google re-auth popup blocked

**Solution:** Ensure popup blockers are disabled or add exception for your domain

## Best Practices

1. **Clear action descriptions:** Use descriptive text for what the re-auth is for
   ```typescript
   // Good
   await requestReauth('delete your account permanently');

   // Bad
   await requestReauth('this action');
   ```

2. **Handle cancellation gracefully:** Always check the return value
   ```typescript
   if (!confirmed) {
     toast.info('Action cancelled');
     return;
   }
   ```

3. **Show loading states:** Disable buttons during re-auth
   ```typescript
   const [loading, setLoading] = useState(false);
   // ...
   <Button disabled={loading}>
   ```

4. **Provide feedback:** Use toasts to inform user of success/failure
   ```typescript
   toast.success('Account deleted successfully');
   toast.error('Failed to delete account');
   ```

5. **Test both providers:** Test with both email/password and Google auth

## Migration from Old Code

If you have old code using the deprecated `promptForPassword()`:

**Before:**
```typescript
const password = await promptForPassword('delete account');
if (!password) return;
```

**After:**
```typescript
const { requestReauth } = useReauth();
const confirmed = await requestReauth('delete your account');
if (!confirmed) return;
```

## Additional Resources

- [Firebase Re-authentication Documentation](https://firebase.google.com/docs/auth/web/manage-users#re-authenticate_a_user)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [PCI DSS Requirement 8.2.3](https://www.pcisecuritystandards.org/)
