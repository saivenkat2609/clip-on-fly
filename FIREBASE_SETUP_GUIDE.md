# Firebase Authentication Setup Guide

This guide will help you configure Firebase Authentication for your ClipForge application.

## Prerequisites
- A Google account
- Firebase CLI (optional, for advanced configuration)

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter your project name (e.g., "ClipForge")
4. Disable Google Analytics (optional) or configure it
5. Click "Create project"

## Step 2: Register Your Web App

After creating your project, you should see a screen that says "Get started by adding Firebase to your app".

**Option A - If you see the welcome screen:**
1. Click on the **Web icon** that looks like `</>` (angle brackets with a slash)
2. It should be among other platform icons (iOS, Android, Unity, etc.)

**Option B - If you're already in the project dashboard:**
1. Look at the top left, near your project name
2. Click on **Project Overview** (if not already there)
3. Look for a section that says "Get started by adding Firebase to your app"
4. Click the **Web icon** (`</>`)

**Option C - Alternative method:**
1. In the left sidebar, click the **gear/settings icon** ⚙️ next to "Project Overview"
2. Click **"Project settings"**
3. Scroll down to the **"Your apps"** section
4. Click the **Web icon** (`</>`) button or **"Add app"** and select Web

**After clicking the web icon:**
1. Register your app:
   - App nickname: "ClipForge Web" (or any name you prefer)
   - **Do NOT check** "Also set up Firebase Hosting" (unless you plan to use it)
2. Click **"Register app"**
3. You'll see a code snippet with `firebaseConfig` - **Copy these values!**
4. Click **"Continue to console"**

## Step 3: Enable Authentication Methods

1. In the Firebase Console, go to **Authentication** (from the left sidebar)
2. Click the **Sign-in method** tab
3. Enable **Email/Password**:
   - Click on "Email/Password"
   - Toggle "Enable"
   - Click "Save"

4. Enable **Google** sign-in:
   - Click on "Google"
   - Toggle "Enable"
   - Select a project support email
   - Click "Save"

## Step 4: Configure Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

3. **IMPORTANT**: Never commit `.env.local` to version control!

## Step 5: Configure Authorized Domains (for Production)

1. In Firebase Console, go to **Authentication** > **Settings** > **Authorized domains**
2. Add your production domain (e.g., `clipforge.com`)
3. Add your staging domain if you have one

## Step 6: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:8080
3. Click "Get Started" or "Sign In"
4. Try both authentication methods:
   - Sign up with email/password
   - Sign in with Google

## Security Features Implemented

### 1. Disposable Email Detection
- **800+ known disposable domains** blocked
- Checks for suspicious email patterns
- Validates email format using RFC 5322 standard
- File: `src/lib/disposableEmailDomains.ts`

### 2. Google OAuth Validation
- Only Gmail accounts allowed for Google sign-in
- Verifies email is verified by Google
- Checks for account selection

### 3. Protected Routes
- All dashboard routes require authentication
- Automatic redirect to login for unauthorized access
- Maintains original destination after login

### 4. Email Verification
- Automatic verification email sent on signup
- Encourages users to verify their email

## Common Issues and Solutions

### Issue: "Firebase: Error (auth/invalid-api-key)"
**Solution**: Check that your API key in `.env.local` is correct and the file is in the project root.

### Issue: "Firebase: Error (auth/unauthorized-domain)"
**Solution**: Add your domain to Authorized domains in Firebase Console.

### Issue: Google Sign-in popup blocked
**Solution**: Allow popups for localhost or your domain in browser settings.

### Issue: Disposable email not blocked
**Solution**: The email domain might not be in our list. Add it to `src/lib/disposableEmailDomains.ts`.

## Updating the Disposable Email List

To add more disposable email domains:

1. Open `src/lib/disposableEmailDomains.ts`
2. Add new domains to the `disposableEmailDomains` Set:
   ```typescript
   'newdisposable.com',
   'another-temp-mail.com',
   ```
3. Domains are automatically checked in lowercase

## Email Validation Flow

1. **Format Check**: Validates RFC 5322 email format
2. **Disposable Check**: Checks against 800+ known domains
3. **Pattern Check**: Looks for suspicious patterns (long random strings, etc.)
4. **Known Provider Check**: Allows well-known providers (Gmail, Yahoo, Outlook, etc.)

## Testing Disposable Email Detection

Try these test cases:
- ✅ Valid: `user@gmail.com`
- ✅ Valid: `user@outlook.com`
- ❌ Blocked: `user@tempmail.com`
- ❌ Blocked: `user@10minutemail.com`
- ❌ Blocked: `user@guerrillamail.com`

## Firebase Console Quick Links

- **Authentication Dashboard**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/authentication
- **Users List**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/authentication/users
- **Sign-in Methods**: https://console.firebase.google.com/project/YOUR_PROJECT_ID/authentication/providers

## Additional Security Recommendations

1. **Enable Email Enumeration Protection** (Firebase Console > Authentication > Settings)
2. **Set up Firebase Security Rules** for Firestore/Storage if you add those later
3. **Monitor Authentication Activity** regularly in Firebase Console
4. **Enable Multi-Factor Authentication** (MFA) for admin accounts
5. **Implement rate limiting** on your backend if you add one

## Need Help?

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Firebase JavaScript SDK Reference](https://firebase.google.com/docs/reference/js/auth)
- [React Firebase Hooks](https://github.com/CSFrequency/react-firebase-hooks)

## Files Created

- `src/lib/firebase.ts` - Firebase initialization
- `src/lib/disposableEmailDomains.ts` - Disposable email list (800+ domains)
- `src/lib/emailValidator.ts` - Email validation logic
- `src/contexts/AuthContext.tsx` - Authentication context and hooks
- `src/components/ProtectedRoute.tsx` - Route protection component
- `src/pages/Login.tsx` - Login/Signup page
- `.env.local` - Environment variables (configure this!)

Your authentication system is now ready to use!
