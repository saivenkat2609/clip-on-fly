# Cross-Provider Authentication Guide

This guide explains how ClipForge handles users trying to use the same email with different authentication methods (Google OAuth vs Email/Password).

## Problem Statement

**Scenario**: A user signs up with Google OAuth using `john@gmail.com`. Later, they try to:
1. Sign up again using email/password with `john@gmail.com`
2. Sign in with email/password using `john@gmail.com`

**Question**: Will they see their existing data? What happens?

## Solution Implemented

### ✅ **Smart Provider Detection**

The system now **automatically detects** which authentication provider was used for each email and provides **clear guidance** to users.

## How It Works

### 1. Sign-Up Flow with Existing Email

When a user tries to sign up with an email that already exists:

```
User enters: john@gmail.com + password
         ↓
System checks: Is this email already registered?
         ↓
If YES → Check provider:
   - Google OAuth? → Show: "Use Continue with Google button"
   - Email/Password? → Show: "Email exists. Please sign in"
         ↓
Form submission is BLOCKED
User sees clear error message
```

### 2. Sign-In Flow with Wrong Provider

When a user tries to sign in with password but account was created with Google:

```
User enters: john@gmail.com + password
         ↓
System checks: What providers does this email have?
         ↓
Found: Google OAuth (no password set)
         ↓
Block sign-in attempt
         ↓
Show message: "Account created with Google. Use the Google button"
```

## User Experience

### Scenario 1: User Signed Up with Google, Tries Email Sign-Up

**User Action**: Clicks "Sign up" → Enters `john@gmail.com` + password

**System Response**:
```
❌ Error Toast (7 seconds):
Title: "Email Already Registered"
Message: "This email is already registered with Google.
         Please use the 'Continue with Google' button to sign in."
```

**What User Should Do**: Click "Continue with Google" button

### Scenario 2: User Signed Up with Google, Tries Email Sign-In

**User Action**: Clicks "Sign in" → Enters `john@gmail.com` + password

**System Response**:
```
❌ Error Toast (7 seconds):
Title: "Error"
Message: "This account was created with Google.
         Please use the 'Continue with Google' button to sign in."
```

**What User Should Do**: Click "Continue with Google" button

### Scenario 3: User Signed Up with Email, Tries Email Sign-Up Again

**User Action**: Clicks "Sign up" → Enters `existing@gmail.com` + password

**System Response**:
```
❌ Error Toast (7 seconds):
Title: "Email Already Registered"
Message: "This email is already registered.
         Please sign in with your password instead."
```

**What User Should Do**: Switch to "Sign in" tab and use password

### Scenario 4: User Signed Up with Email, Tries Google OAuth

**User Action**: Clicks "Continue with Google" → Selects `existing@gmail.com`

**System Behavior**:
- ✅ **Success!** Firebase automatically links the accounts
- ✅ User is signed in and sees all their existing data
- ✅ They can now use either method (Google or password) in the future

## Technical Implementation

### Firebase API Used

```typescript
import { fetchSignInMethodsForEmail } from 'firebase/auth';

// Check what providers an email has
const methods = await fetchSignInMethodsForEmail(auth, email);
// Returns: ['google.com'] or ['password'] or both
```

### Sign-Up Validation

**File**: `src/contexts/AuthContext.tsx:45-91`

```typescript
async function signUp(email: string, password: string) {
  // Check if email exists
  const signInMethods = await fetchSignInMethodsForEmail(auth, email);

  if (signInMethods.length > 0) {
    if (signInMethods.includes('google.com')) {
      throw new Error('Email registered with Google. Use Google button.');
    } else if (signInMethods.includes('password')) {
      throw new Error('Email exists. Please sign in instead.');
    }
  }

  // Proceed with sign-up...
}
```

### Sign-In Validation

**File**: `src/contexts/AuthContext.tsx:93-122`

```typescript
async function signIn(email: string, password: string) {
  // Check providers
  const signInMethods = await fetchSignInMethodsForEmail(auth, email);

  if (signInMethods.length === 0) {
    throw new Error('No account found. Please sign up first.');
  }

  if (signInMethods.includes('google.com') &&
      !signInMethods.includes('password')) {
    throw new Error('Account created with Google. Use Google button.');
  }

  // Proceed with sign-in...
}
```

## Data Persistence

### ✅ Same Email = Same Account Data

When a user uses the **same email** with different providers:

| Scenario | Data Access | Explanation |
|----------|-------------|-------------|
| Google → Google | ✅ Same data | Same account, same provider |
| Password → Password | ✅ Same data | Same account, same provider |
| Google → Password attempt | ❌ Blocked | System prevents wrong provider |
| Password → Google attempt | ✅ **Links accounts** | Firebase auto-links, keeps data |

### Important Note on Account Linking

Firebase has a feature called **Account Linking**:

- If user signs up with **email/password** first
- Then signs in with **Google** using the same email
- Firebase **automatically links** the two providers
- User now has **one account** with **two sign-in methods**
- **All data is preserved**

However:
- If user signs up with **Google** first
- Firebase **won't auto-link** a password provider
- User must use Google to access their account

## Error Messages

All error messages are **clear** and **actionable**:

### Sign-Up Errors

| Error Code | Message | Duration |
|------------|---------|----------|
| `auth/email-already-in-use` (Google) | "This email is already registered with Google. Please use the 'Continue with Google' button to sign in." | 7 seconds |
| `auth/email-already-in-use` (Password) | "This email is already registered. Please sign in with your password instead." | 7 seconds |
| `auth/weak-password` | "Password is too weak. Please use a stronger password." | 7 seconds |
| `auth/invalid-email` | "Invalid email address format." | 7 seconds |

### Sign-In Errors

| Error Code | Message | Duration |
|------------|---------|----------|
| `auth/user-not-found` | "No account found with this email. Please sign up first." | 7 seconds |
| `auth/wrong-password` (Google account) | "This account was created with Google. Please use the 'Continue with Google' button to sign in." | 7 seconds |
| `auth/wrong-password` (Password wrong) | "Incorrect password. If you signed up with Google, please use the 'Continue with Google' button instead." | 7 seconds |
| `auth/invalid-credential` | "Invalid credentials. If you signed up with Google, please use the 'Continue with Google' button instead." | 7 seconds |
| `auth/too-many-requests` | "Too many failed attempts. Please try again later." | 7 seconds |

## Testing Scenarios

### Test 1: Google First, Then Try Password Sign-Up

1. **Sign up with Google**: `test@gmail.com`
2. **Sign out**
3. **Try to sign up** with email: `test@gmail.com` + password
4. **Expected Result**: ❌ Error → "Email registered with Google. Use Google button."

### Test 2: Google First, Then Try Password Sign-In

1. **Sign up with Google**: `test@gmail.com`
2. **Sign out**
3. **Try to sign in** with email: `test@gmail.com` + password
4. **Expected Result**: ❌ Error → "Account created with Google. Use Google button."

### Test 3: Password First, Then Try Password Sign-Up

1. **Sign up with password**: `test@gmail.com` + password
2. **Sign out**
3. **Try to sign up again** with same email
4. **Expected Result**: ❌ Error → "Email already registered. Please sign in."

### Test 4: Password First, Then Try Google Sign-In ✅

1. **Sign up with password**: `test@gmail.com` + password
2. **Add some data** (projects, etc.)
3. **Sign out**
4. **Sign in with Google**: Use `test@gmail.com`
5. **Expected Result**: ✅ Success!
   - Accounts are linked
   - All previous data is visible
   - Can use either method now

## Benefits

### For Users:
✅ **Clear guidance** on how to sign in
✅ **No confusion** about which button to use
✅ **Data security** - can't accidentally create duplicate accounts
✅ **Error messages last 7 seconds** - enough time to read
✅ **Actionable** - tells them exactly what to do

### For Developers:
✅ **Prevents duplicate accounts**
✅ **Maintains data integrity**
✅ **Reduces support tickets**
✅ **Better user experience**
✅ **Firebase-native solution**

## Updated Features

### 1. No Name Field in Sign-Up

- **Removed**: Name input field
- **Auto-generated**: Display name from email
  - Example: `john.doe@gmail.com` → Display name: "John"
  - Takes part before `@`, capitalizes first letter

### 2. Longer Error Toast Duration

- **Changed from**: 4 seconds (default)
- **Changed to**: 7 seconds
- **Reason**: Users need time to read and understand the message

### 3. Provider-Specific Error Messages

- **Before**: Generic "Email already in use"
- **After**: Specific guidance based on provider
  - "Use Continue with Google button"
  - "Sign in with your password"

## File Changes

### Modified Files:

1. **`src/pages/Login.tsx`**
   - Removed name field from sign-up form
   - Updated schema to not require name
   - Enhanced error messages
   - Added 7-second toast duration

2. **`src/contexts/AuthContext.tsx`**
   - Added `fetchSignInMethodsForEmail` import
   - Updated `signUp()` to check existing providers
   - Updated `signIn()` to detect Google accounts
   - Auto-generate display name from email

## Firebase Console

To see which provider a user is using:

1. Go to Firebase Console → Authentication → Users
2. Find the user by email
3. Look at "Providers" column:
   - Shows `google.com` for Google OAuth
   - Shows `password` for email/password
   - Can show both if accounts are linked

## FAQ

### Q: Can users have multiple accounts with the same email?
**A**: No. Firebase prevents this. One email = one account.

### Q: What if user forgets which method they used?
**A**: The error messages tell them! If they try wrong method, we guide them to the correct one.

### Q: Can a user with Google account set a password later?
**A**: Not automatically. You'd need to implement a "Set Password" feature in settings. (Future enhancement)

### Q: What happens if user deletes their Google account?
**A**: If they only used Google OAuth, they lose access. That's why account linking is important.

### Q: Will data transfer between providers?
**A**: Yes! It's the same Firebase account, just different sign-in methods. All data is shared.

### Q: How long until Firebase account linking happens?
**A**: Instant! The moment user signs in with Google (after having password), accounts link immediately.

## Security Considerations

✅ **Email verification** still sent (even though not required)
✅ **Disposable emails** blocked (800+ domains)
✅ **Provider validation** prevents unauthorized access
✅ **Clear error messages** without revealing sensitive info
✅ **Firebase security rules** protect user data

## Summary

Your authentication system now:

✅ **Detects** which provider users originally signed up with
✅ **Prevents** wrong provider attempts with clear messages
✅ **Guides** users to the correct sign-in method
✅ **Preserves** all user data across providers (when possible)
✅ **Shows errors for 7 seconds** so users can read them
✅ **Auto-generates** display names from email
✅ **Simplifies** sign-up by removing name field

This creates a **seamless, secure, and user-friendly** authentication experience! 🎉
