# MongoDB Atlas Authentication Pattern Implementation

## Overview
This project now implements the same cross-provider authentication pattern used by MongoDB Atlas. This ensures users can only have one account per email address and provides clear guidance when they try to use the wrong authentication method.

## How It Works

### Scenario 1: User Signs Up with Google, Then Tries Email/Password

**Flow:**
1. User creates account with "Continue with Google"
2. Later, user tries to sign up with email/password using the same email
3. System detects existing Google account
4. Shows error: "This email is already registered with Google. Please use the 'Continue with Google' button to sign in."
5. Real-time validation prevents form submission

**Implementation:**
- `AuthContext.tsx:53-70` - Checks existing providers during email/password signup
- `Login.tsx:75-99` - Real-time email validation during signup
- Error shown inline in the form with red border

---

### Scenario 2: User Signs Up with Email/Password, Then Tries Google

**Flow:**
1. User creates account with email/password
2. Later, user clicks "Continue with Google"
3. Firebase OAuth popup opens and user selects their Google account
4. System detects existing password account
5. Immediately signs out the auto-linked Google session
6. Shows prominent banner: "This email is already registered with a password. Please sign in using your email and password instead."

**Implementation:**
- `AuthContext.tsx:127-174` - Checks for existing password accounts after Google sign-in
- `Login.tsx:267-296` - Handles the error and displays provider conflict banner
- Automatically switches to login mode if user was in signup mode

---

### Scenario 3: User Tries to Login with Wrong Method

**Flow:**
1. User has account with Google
2. User tries to sign in with email/password
3. System detects Google-only account
4. Shows prominent blue banner with "Sign in with Google" button
5. User can click button to immediately sign in with correct method

**Implementation:**
- `AuthContext.tsx:96-125` - Checks providers during email/password login
- `Login.tsx:173-226` - Handles error and shows provider conflict banner with action button

---

## UI Components

### Provider Conflict Banner (MongoDB Atlas Style)

Located in `Login.tsx:327-352`

```tsx
<Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
  <AlertDescription>
    <p className="font-medium mb-2">{providerConflict.message}</p>
    {providerConflict.suggestedProvider === 'google' ? (
      <Button onClick={handleGoogleSignIn}>
        Sign in with Google
      </Button>
    ) : (
      <p>Please use the email and password form below to sign in.</p>
    )}
  </AlertDescription>
</Alert>
```

**Features:**
- Prominent blue banner at top of login card
- Clear message explaining the issue
- Actionable button for Google sign-in
- Guidance text for email/password
- Responsive design with dark mode support

---

## Key Implementation Details

### 1. Provider Detection
Uses Firebase's `fetchSignInMethodsForEmail()` to check existing authentication methods:
```typescript
const signInMethods = await fetchSignInMethodsForEmail(auth, email);
const hasGoogle = signInMethods.includes('google.com');
const hasPassword = signInMethods.includes('password');
```

### 2. Error Handling
Custom error codes and messages for provider conflicts:
```typescript
const error = new Error('This email is already registered with Google...');
(error as any).code = 'auth/account-exists-with-different-credential';
throw error;
```

### 3. Auto Sign-Out
Immediately signs out incorrectly linked accounts:
```typescript
if (hasPasswordProvider && !hasGoogleProvider) {
  await signOut(auth);
  throw new Error('...');
}
```

### 4. Real-Time Validation
Signup form validates email as user types:
```typescript
const handleSignupEmailChange = async (email: string) => {
  const signInMethods = await fetchSignInMethodsForEmail(auth, email);
  if (signInMethods.length > 0) {
    setEmailValidationStatus('invalid');
    // Show appropriate error
  }
};
```

---

## Files Modified

1. **`src/contexts/AuthContext.tsx`**
   - Enhanced `signUp()` to check for existing Google accounts
   - Enhanced `signIn()` to detect Google-only accounts
   - Added `signInWithGoogle()` check for existing password accounts

2. **`src/pages/Login.tsx`**
   - Added `providerConflict` state for banner display
   - Enhanced error handlers to show provider conflict banner
   - Added MongoDB Atlas-style alert component
   - Auto-switches to login mode when conflict detected

---

## Testing the Implementation

### Test Case 1: Google → Email/Password
1. Sign up with Google
2. Sign out
3. Try to sign up with email/password using same email
4. ✅ Should see error in form and prevent signup

### Test Case 2: Email/Password → Google
1. Sign up with email/password
2. Sign out
3. Try to sign in with Google
4. ✅ Should see blue banner: "Use password instead"

### Test Case 3: Login with Wrong Method
1. Have Google account
2. Try email/password login
3. ✅ Should see blue banner with "Sign in with Google" button

### Test Case 4: Correct Method
1. Sign up with any method
2. Sign out
3. Sign in with same method
4. ✅ Should work normally

---

## Benefits

1. **Single Account Per Email** - No duplicate accounts with same email
2. **Clear User Guidance** - Users know exactly which method to use
3. **Actionable UI** - One-click button to use correct method
4. **Real-Time Feedback** - Validation during signup prevents errors
5. **Professional UX** - Matches behavior of major platforms (MongoDB Atlas, GitHub, etc.)

---

## Configuration

The implementation follows these rules:

- **Gmail-only emails**: Only @gmail.com and @googlemail.com addresses are allowed
- **Provider priority**: No automatic linking - user must use original method
- **Error display**: Inline errors + prominent banner for provider conflicts
- **Auto-switching**: Automatically switches to login mode when conflict detected

---

## Future Enhancements

Potential improvements for account linking:

1. **Manual Account Linking**
   - Allow users to link providers from account settings
   - Require password verification before linking

2. **Account Recovery**
   - "Forgot which method you used?" link
   - Check email and suggest available methods

3. **Multi-Provider Support**
   - Allow both Google and password on same account
   - Show all available methods on login screen

4. **Provider Management**
   - Settings page to view/manage linked providers
   - Option to remove provider (if multiple exist)

---

## Security Considerations

1. **Immediate Sign-Out**: Prevents auto-linked accounts from persisting
2. **Email Verification**: Email/password signups send verification email
3. **Provider Validation**: Checks existing methods before allowing operations
4. **OAuth Verified**: Google OAuth emails are pre-verified by Google
5. **Clear Errors**: Prevents user confusion that could lead to security issues
