# YouTube Auto-Post Feature - Configuration Checklist

## Issues Found & Solutions

After reviewing your YouTube auto-post implementation, here are the issues and what you need to do:

---

## 🔴 Issue 1: Google Cloud Console App Not Published (MAIN ISSUE)

**Status**: ❌ Blocking users from authorizing

**What's happening**:
- Your OAuth app is in "Testing" mode
- Only explicitly added test users can authorize
- Everyone else gets "unauthorized" error

**Solution**:
See `GOOGLE-CLOUD-PUBLISH-GUIDE.md` for detailed steps.

**Quick fix** (5 minutes):
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project: ``
3. Go to **APIs & Services** → **OAuth consent screen**
4. Click **"Publish App"**
5. Click **"Confirm"**

**After publishing**:
- Users will see "This app hasn't been verified by Google" warning
- They CAN still authorize by clicking "Advanced" → "Go to Reframe AI (unsafe)"
- This is normal and acceptable for early-stage apps

---

## 🟡 Issue 2: Firebase Secrets Not Configured

**Status**: ⚠️ May cause runtime errors

**What's happening**:
- Your Cloud Functions use `defineSecret()` to access credentials
- These secrets need to be set in Firebase, not just `.env.local`
- `.env.local` only affects frontend code, not Cloud Functions

**Current code** (`functions/src/index.ts:16-18`):
```typescript
const youtubeClientId = defineSecret("YOUTUBE_CLIENT_ID");
const youtubeClientSecret = defineSecret("YOUTUBE_CLIENT_SECRET");
const encryptionKey = defineSecret("ENCRYPTION_KEY");
```

**Solution**:

### Step 1: Set Firebase Active Project
```bash
cd reframe-ai
firebase use 
```

### Step 2: Set YouTube Credentials as Secrets
```bash
firebase functions:secrets:set YOUTUBE_CLIENT_ID
# Paste:
# Press Enter

firebase functions:secrets:set YOUTUBE_CLIENT_SECRET
# Paste: 
# Press Enter
```

### Step 3: Generate and Set Encryption Key

**Option A - Using Node.js**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option B - Using PowerShell** (Windows):
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Option C - Online Generator**:
Visit: https://www.random.org/strings/ and generate a 32-character string

**Then set it**:
```bash
firebase functions:secrets:set ENCRYPTION_KEY
# Paste your generated key
# Press Enter
```

### Step 4: Redeploy Functions
```bash
firebase deploy --only functions
```

**Verification**:
```bash
# List all secrets
firebase functions:secrets:list
```

You should see:
```
YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET
ENCRYPTION_KEY
```

---

## 🟢 Issue 3: Redirect URI Configuration

**Status**: ✅ Appears correct, but verify

**What to check**:

### In Google Cloud Console:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project ``
3. Go to **APIs & Services** → **Credentials**
4. Click your OAuth 2.0 Client ID
5. Under **"Authorized redirect URIs"**, you MUST have:

```
```

**Important**: This must match EXACTLY what's in your code at `functions/src/index.ts:108`

### Also add your frontend callback (optional but recommended):
```
https://yourdomain.com/auth/youtube/callback
http://localhost:5173/auth/youtube/callback (for development)
```

### Click "Save" after adding

---

## 🟢 Issue 4: YouTube Data API Enabled

**Status**: Needs verification

**What to check**:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select project ``
3. Go to **APIs & Services** → **Library**
4. Search for: `YouTube Data API v3`
5. Make sure it shows **"API enabled"** with a green checkmark
6. If not, click **"Enable"**

---

## 🟢 Issue 5: Firebase Blaze Plan

**Status**: Needs verification

**What to check**:

Your Cloud Functions make external API calls (YouTube API), which requires the **Blaze (Pay-as-you-go)** plan.

**To check**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project ``
3. Click **Spark/Blaze** (top left, under project name)
4. If it says "Spark (Free)", you need to upgrade

**To upgrade**:
1. Click **"Modify plan"**
2. Select **"Blaze"**
3. Set a billing budget alert (recommended: $10/month)
4. Confirm

**Cost estimate**:
- Free tier: 2M function invocations, 400K GB-seconds
- After free tier: ~$0.40 per 1M invocations
- For YouTube feature: ~$5-10/month for small usage

---

## 🟢 Issue 6: CORS Configuration

**Status**: May need attention if users report errors

**Current implementation**: Cloud Function handles callback directly, so CORS should not be an issue.

**If users report CORS errors**:

1. Add CORS middleware to your Cloud Functions
2. Or ensure your Cloud Function URL is whitelisted

**Not needed immediately**, but keep in mind if errors occur.

---

## 🟢 Issue 7: Firestore Security Rules

**Status**: ✅ Need to verify

**Check your `firestore.rules` file** includes:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ... your other rules ...

    // Social media connections (YouTube)
    match /user_social_connections/{connectionId} {
      allow read: if request.auth != null &&
                    request.auth.uid == resource.data.userId;
      allow write: if request.auth != null &&
                     request.auth.uid == request.resource.data.userId;
      allow delete: if request.auth != null &&
                      request.auth.uid == resource.data.userId;
    }
  }
}
```

**To deploy**:
```bash
firebase deploy --only firestore:rules
```

---

## Complete Setup Checklist

Use this checklist to ensure everything is configured:

### Google Cloud Console Setup
- [ ] Project created: ``
- [ ] YouTube Data API v3 enabled
- [ ] OAuth consent screen configured
  - [ ] App name set
  - [ ] User support email set
  - [ ] Scopes added:
    - [ ] `https://www.googleapis.com/auth/youtube.upload`
    - [ ] `https://www.googleapis.com/auth/youtube.force-ssl`
- [ ] OAuth 2.0 credentials created
  - [ ] Client ID: 
  - [ ] Client Secret: ``
- [ ] Authorized redirect URIs configured:
  - [ ] ``
  - [ ] Your production domain callback (if applicable)
- [ ] **App published** (most important!)

### Firebase Setup
- [ ] Firebase project: ``
- [ ] Blaze plan enabled
- [ ] Cloud Functions deployed
- [ ] Firebase secrets configured:
  - [ ] `YOUTUBE_CLIENT_ID`
  - [ ] `YOUTUBE_CLIENT_SECRET`
  - [ ] `ENCRYPTION_KEY`
- [ ] Firestore security rules deployed

### Frontend Configuration
- [ ] `.env.local` file has:
  - [ ] `VITE_FIREBASE_*` variables
  - [ ] `VITE_YOUTUBE_CLIENT_ID` (for reference, not used in functions)
  - [ ] `VITE_YOUTUBE_CLIENT_SECRET` (for reference, not used in functions)

### Code Verification
- [ ] `firebase.ts` exports `functions`
- [ ] `YOUTUBE_OAUTH_CALLBACK_URL` is correct
- [ ] Route `/auth/youtube/callback` exists
- [ ] `YouTubeConnection` component integrated in Settings/Dashboard
- [ ] `YouTubePostModal` component integrated in Project Details

### Testing
- [ ] Local development works with test users
- [ ] Cloud Functions are deployed and accessible
- [ ] OAuth flow completes successfully
- [ ] Video upload works
- [ ] Token refresh works
- [ ] Disconnect functionality works

---

## Testing Steps

### Test 1: OAuth Connection Flow

1. **Open your hosted app** (not localhost)
2. **Sign in** with your account
3. **Go to Settings** → Social Media tab
4. **Click "Connect YouTube"**
5. **You should see**:
   - Redirect to Google OAuth page
   - "Reframe AI wants to upload videos..." message
   - If app is published: You can click "Allow" (even if unverified)
   - If app is NOT published: "Access blocked" error (if you're not a test user)
6. **After authorizing**:
   - Redirect back to your app
   - See "YouTube Connected" with your channel name
7. **Check Firestore**:
   - Collection: `user_social_connections`
   - Document should exist with your YouTube connection

### Test 2: Video Upload

1. **Go to a processed video** in Project Details
2. **Click "Post to YouTube"**
3. **Fill in**:
   - Title: "Test Upload"
   - Description: "Testing auto-post"
   - Tags: "test"
   - Privacy: "Unlisted" (for testing)
4. **Click "Upload to YouTube"**
5. **Wait for upload** (30 seconds - 2 minutes)
6. **Check YouTube Studio**: https://studio.youtube.com
7. **Verify**:
   - Video appears in your channel
   - Title, description, tags are correct
   - Privacy setting is correct

### Test 3: Error Handling

1. **Try to upload without connection**:
   - Should see: "Please connect your YouTube account first"
2. **Try to upload with invalid video URL**:
   - Should see error message
3. **Disconnect YouTube**:
   - Click "Disconnect" button
   - Should remove connection from Firestore
   - Should update UI to show "Connect YouTube" button again

---

## Common Errors and Solutions

### Error: "Access blocked: This app's request is invalid"

**Cause**: App is in Testing mode

**Solution**: Publish your app (see `GOOGLE-CLOUD-PUBLISH-GUIDE.md`)

---

### Error: "Redirect URI mismatch"

**Cause**: Redirect URI in code doesn't match Google Cloud Console

**Solution**:
1. Check `functions/src/index.ts:108`
2. Match it exactly in Google Cloud Console
3. Redeploy: `firebase deploy --only functions`

---

### Error: "The server encountered an error"

**Cause**: Firebase secrets not configured

**Solution**: Set secrets as described in Issue 2 above

---

### Error: "Quota exceeded"

**Cause**: YouTube API daily quota exceeded

**Solution**:
- Wait until midnight Pacific Time (quota resets)
- Or request quota increase in Google Cloud Console

---

### Error: "Token expired" or "Invalid credentials"

**Cause**: Access token expired and refresh failed

**Solution**:
- User should disconnect and reconnect YouTube account
- Check that refresh token is stored in Firestore
- Verify token refresh logic in `functions/src/index.ts:190`

---

### Error: "No active project"

**Cause**: Firebase CLI doesn't know which project to use

**Solution**:
```bash
cd reframe-ai
firebase use 
```

---

## Priority Order

To get YouTube auto-post working online:

### Priority 1 (Critical - Do First):
1. ✅ **Publish your Google Cloud Console app**
2. ✅ **Set Firebase secrets** (YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, ENCRYPTION_KEY)
3. ✅ **Redeploy Cloud Functions**

### Priority 2 (Important):
4. ✅ **Verify redirect URIs** in Google Cloud Console
5. ✅ **Enable YouTube Data API v3**
6. ✅ **Upgrade to Firebase Blaze plan** (if not already)

### Priority 3 (Testing):
7. ✅ **Test OAuth flow** with non-test user
8. ✅ **Test video upload**
9. ✅ **Monitor for errors**

---

## Quick Commands Reference

```bash
# Set active Firebase project
firebase use 

# Set secrets
firebase functions:secrets:set YOUTUBE_CLIENT_ID
firebase functions:secrets:set YOUTUBE_CLIENT_SECRET
firebase functions:secrets:set ENCRYPTION_KEY

# List secrets
firebase functions:secrets:list

# Deploy functions
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules

# View function logs
firebase functions:log --limit 50

# Check deployed functions
firebase functions:list
```

---

## Monitoring & Debugging

### View Cloud Function Logs

**In Terminal**:
```bash
firebase functions:log --limit 50
```

**In Firebase Console**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select ``
3. Click **Functions** (left sidebar)
4. Click on a function name
5. Click **Logs** tab

### Check YouTube API Quota

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select ``
3. Go to **APIs & Services** → **Dashboard**
4. Click **YouTube Data API v3**
5. View quota usage graph

---

## Next Steps After Everything Works

1. **Submit for Google verification** (optional but recommended)
   - See `GOOGLE-CLOUD-PUBLISH-GUIDE.md` for details
   - Takes 2-4 weeks
   - Removes warning for users

2. **Add monitoring and alerts**
   - Set up Firebase Alerts for function errors
   - Monitor YouTube API quota usage
   - Track user connections in analytics

3. **Add features**
   - Schedule posts for later
   - Custom thumbnail upload
   - Add to playlists
   - Bulk upload multiple clips

4. **Optimize**
   - Add retry logic for failed uploads
   - Improve error messages
   - Add progress indicator for large uploads

---

## Summary

**Main issue**: App not published in Google Cloud Console

**Critical fixes**:
1. Publish app in Google Cloud Console (5 minutes)
2. Set Firebase secrets (5 minutes)
3. Redeploy Cloud Functions (5 minutes)

**Total time to fix**: ~15-20 minutes

**After fixes**:
- Users can authorize (with warning if unverified)
- YouTube auto-post will work online
- You can launch immediately

**For best experience**:
- Submit for Google verification (2-4 weeks)
- Once verified, no warnings for users

You're very close to having a fully working YouTube auto-post feature! 🚀
