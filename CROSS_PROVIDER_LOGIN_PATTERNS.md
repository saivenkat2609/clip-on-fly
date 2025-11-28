# Cross-Provider Login Patterns: How Major Websites Handle Google & Email Login

## Overview
This document describes common patterns used by major websites to handle users who sign up with one method (e.g., Google) and later try to sign in with another method (e.g., email/password) using the same email address.

## Common Patterns

### 1. **MongoDB Atlas Pattern** (Account Linking)

**How it works:**
- User signs up with Google (email: user@gmail.com)
- Later, user tries to sign in with email/password using the same email
- System detects that an account already exists with that email via Google
- User is prompted: "An account with this email already exists. Please sign in with Google."
- Optionally, allows user to link both methods after verifying identity

**Benefits:**
- Single account per email address
- Clear user communication
- Prevents duplicate accounts

---

### 2. **GitHub Pattern** (Provider Detection)

**How it works:**
- User signs up with email/password
- Later tries to sign in with Google OAuth
- System detects existing account with that email
- Automatically links OAuth provider to existing account after user confirms
- User can now sign in with either method

**Key features:**
- Proactive account linking
- User maintains single identity
- Shows all linked providers in account settings

---

### 3. **Notion Pattern** (Smart Redirect)

**How it works:**
- User attempts to sign up/in with any method
- System checks which authentication methods are already associated with that email
- Displays available sign-in methods: "Continue with Google" or "Continue with Password"
- Prevents creating duplicate accounts

**User Experience:**
- Login form automatically shows correct sign-in options
- Clear visual indicators of available methods
- Seamless experience

---

### 4. **Slack Pattern** (Email-First Approach)

**How it works:**
- User always enters email first
- System checks backend for existing authentication methods
- Shows appropriate sign-in options based on what's registered
- If email has Google OAuth, shows "Continue with Google"
- If email has password, shows password field

**Benefits:**
- Single entry point (email)
- Backend determines available methods
- Reduces user confusion

---

### 5. **Spotify Pattern** (Multiple Accounts)

**How it works:**
- Allows separate accounts for different authentication methods
- Email/password and Google OAuth can create separate accounts with same email
- User manually links accounts from settings if desired

**Drawbacks:**
- Can create duplicate accounts
- Confusing for users
- Not recommended for most applications

---

## Recommended Implementation

### Best Practice Flow:

```
1. User attempts sign-up/sign-in with email
   ↓
2. Check if email exists in database
   ↓
3a. If exists with different provider:
    → Show error: "Account exists. Sign in with [Provider]"
    → Offer "Sign in with [Provider]" button

3b. If exists with same provider:
    → Continue with normal sign-in

3c. If doesn't exist:
    → Allow account creation
```

### MongoDB Atlas Specific Example:

**Scenario 1:** Sign up with Google first
```
1. User clicks "Sign up with Google" → Creates account
2. Later tries email/password sign-in
3. System shows: "An account with user@gmail.com already exists.
   Please sign in with Google."
4. Provides "Continue with Google" button
```

**Scenario 2:** Sign up with email first
```
1. User signs up with email/password → Creates account
2. Later tries "Sign in with Google"
3. System detects existing account
4. Prompts: "Link your Google account to user@gmail.com?"
5. After confirmation, both methods work
```

---

## Implementation Tips

1. **Check Provider Before Registration**
   - Use Firebase's `fetchSignInMethodsForEmail()` to detect existing providers
   - Show appropriate error/guidance before account creation

2. **Clear Error Messages**
   - "This email is already registered with [Google/Password]"
   - "Please sign in with [Google/Password] instead"

3. **Allow Account Linking**
   - Let users link multiple providers after initial sign-in
   - Require re-authentication for security

4. **Consistent Email Validation**
   - Use same email normalization across all providers
   - Handle case sensitivity consistently (lowercase)

5. **Security Considerations**
   - Verify email ownership before linking providers
   - Require existing password when adding new provider
   - Log all provider changes for audit

---

## Code Example (Firebase)

```typescript
// Check existing sign-in methods before signup
async function checkExistingAccount(email: string) {
  const methods = await fetchSignInMethodsForEmail(auth, email);

  if (methods.length > 0) {
    if (methods.includes('google.com')) {
      throw new Error('Account exists. Please sign in with Google.');
    }
    if (methods.includes('password')) {
      throw new Error('Account exists. Please sign in with your password.');
    }
  }
}

// Use before allowing email/password signup
await checkExistingAccount(email);
```

---

## Summary

**Best Pattern:** MongoDB Atlas / GitHub approach
- Single account per email
- Clear provider detection
- User-friendly error messages
- Optional provider linking

**Avoid:** Spotify pattern (multiple accounts)
- Creates confusion
- Poor user experience
- Maintenance headaches
