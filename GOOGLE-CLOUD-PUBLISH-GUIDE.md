# Google Cloud Console App Publishing Guide

## Why You Need to Publish Your App

When you create an OAuth application in Google Cloud Console, it starts in **"Testing" mode**. In testing mode:
- ❌ Only explicitly added test users can authorize your app
- ❌ Everyone else sees "Access blocked: This app's request is invalid" or "Unauthorized" errors
- ❌ Your app cannot be used by the general public

To allow **anyone** to use your YouTube auto-post feature, you need to **publish your app**.

---

## Publishing Options

### Option 1: Internal (Organization Only)
- For Google Workspace users only
- Users must be in your organization
- No verification required

### Option 2: Public (External Users)
- For any Google user
- **Recommended for SaaS applications**
- May require verification depending on scopes

---

## Step-by-Step Publishing Guide

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Select your project from the dropdown (top left)
   - Your project should be: `reframe-1e182` or similar

---

### Step 2: Navigate to OAuth Consent Screen

1. Click the **☰** (hamburger menu) in the top left
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. You should see your current app configuration

---

### Step 3: Review Your App Information

Before publishing, make sure these fields are filled out correctly:

#### Required Fields:
- **App name**: `Reframe AI` (or your app name)
- **User support email**: Your email address
- **Developer contact information**: Your email address

#### Recommended Fields (for better user trust):
- **App logo**: Upload your app logo (improves trust)
- **Application homepage**: `https://yourdomain.com`
- **Application privacy policy link**: Link to your privacy policy
- **Application terms of service link**: Link to your terms of service

#### App domain:
- **Authorized domains**: Add your production domain
  - Example: `yourdomain.com` (without https://)
  - This tells Google your app is legitimate

---

### Step 4: Review Scopes

Verify you have these YouTube scopes configured:

1. Click **"Edit App"** if needed
2. Go to **"Scopes"** section
3. Confirm you have:
   - ✅ `https://www.googleapis.com/auth/youtube.upload`
   - ✅ `https://www.googleapis.com/auth/youtube.force-ssl`

These scopes are considered **sensitive** but not **restricted**, so verification *may* not be required.

---

### Step 5: Test User Management

**Before publishing**, you can:
- Keep your current test users (they'll continue to work)
- Add more test users for beta testing
- Remove test users (they can authorize after publishing)

To manage test users:
1. Go to OAuth consent screen
2. Scroll to **"Test users"** section
3. Add or remove users as needed

---

### Step 6: Publish Your App

#### For Apps with Sensitive (but not restricted) Scopes:

1. On the OAuth consent screen page, look for the **"Publishing status"** section
2. You should see one of these:
   - **Testing** (current state)
   - A button that says **"Publish App"** or **"Submit for Verification"**

3. Click **"Publish App"**

4. Read the dialog that appears:
   ```
   "Your app will be available to any user with a Google Account"
   ```

5. Click **"Confirm"**

#### Important Notes:

**If you DON'T need verification:**
- Your app will be published immediately
- Users will see a warning: "This app hasn't been verified by Google"
- Users can still authorize by clicking "Advanced" → "Go to [App Name] (unsafe)"

**If Google requires verification:**
- You'll see a "Submit for Verification" button instead
- Verification can take **2-4 weeks**
- You'll need to provide additional documentation

---

### Step 7: Understanding the Verification Process

#### You MAY need verification if:
- Using sensitive scopes (like YouTube upload)
- Your app will be used by many users (100+)
- Google flags your app for review

#### Verification Requirements:
1. **YouTube video demonstration**
   - Record a video showing how your app uses YouTube scopes
   - Show the OAuth flow
   - Demonstrate video upload feature
   - Max 5 minutes

2. **Written explanation**
   - Explain why your app needs YouTube upload permission
   - Describe your app's functionality
   - Example:
     ```
     "Reframe AI helps users edit and clip their videos. We request YouTube
     upload permission so users can automatically post their edited clips
     directly to their own YouTube channels. Users maintain full control
     over their content."
     ```

3. **Privacy Policy & Terms of Service**
   - Must be publicly accessible
   - Must explain how you use YouTube data
   - Must explain data retention and deletion policies

4. **Domain verification**
   - Verify ownership of your domain
   - Add DNS TXT record or upload verification file

---

### Step 8: Workaround - Unverified App Usage

If you can't get verification immediately or want to launch faster:

**Users CAN still use unverified apps!**

1. Users will see: **"This app hasn't been verified by Google"**
2. Users click: **"Advanced"** (at bottom left)
3. Users click: **"Go to Reframe AI (unsafe)"**
4. Users can then authorize normally

This is perfectly acceptable for:
- Beta testing
- Early stage products
- Internal tools
- Small user base

---

### Step 9: Update Authorized Redirect URIs

Make sure your production redirect URIs are configured:

1. Go to **APIs & Services** → **Credentials**
2. Click on your **OAuth 2.0 Client ID**
3. Under **"Authorized redirect URIs"**, ensure you have:

   ```
   https://us-central1-reframe-1e182.cloudfunctions.net/youtubeOAuthCallback
   ```

   And if your frontend also handles callbacks:
   ```
   https://yourdomain.com/auth/youtube/callback
   ```

4. Click **"Save"**

---

### Step 10: Test Your Published App

1. **Clear browser cache and cookies**
2. **Sign out** of any test accounts
3. **Use a different Google account** (one that's NOT a test user)
4. **Try to connect YouTube** in your hosted app
5. **Verify the flow**:
   - Should see Google OAuth consent screen
   - Should be able to click "Allow" (even if unverified)
   - Should redirect back to your app
   - Should see "YouTube Connected" message

---

## Common Publishing Issues

### Issue 1: "Access Blocked: This app hasn't been verified"

**Cause**: App is published but not verified

**Solutions**:
1. **Option A**: User clicks "Advanced" → "Go to [App] (unsafe)"
2. **Option B**: Submit for verification (takes 2-4 weeks)
3. **Option C**: Keep app in testing mode, manually add users

---

### Issue 2: "The developer hasn't given you access to this app"

**Cause**: App is still in Testing mode

**Solution**:
- Publish the app (Step 6 above)
- OR add user to test users list

---

### Issue 3: "Redirect URI mismatch"

**Cause**: Redirect URI in code doesn't match Google Cloud Console

**Solution**:
1. Check `functions/src/index.ts:108` for redirect URI
2. Match it exactly in Google Cloud Console
3. Redeploy functions: `firebase deploy --only functions`

---

### Issue 4: "Invalid scope"

**Cause**: Requested scopes not configured in OAuth consent screen

**Solution**:
1. Go to OAuth consent screen
2. Edit app → Scopes
3. Add missing scopes
4. Save

---

## Verification Submission Guide

If Google requires verification, here's how to submit:

### Step 1: Prepare Documentation

1. **Create a YouTube demo video:**
   ```
   - Introduction to your app (30 seconds)
   - Show user journey: sign up → process video → connect YouTube
   - Demonstrate OAuth flow (user authorizes)
   - Show video upload to YouTube
   - Explain security measures
   ```

2. **Write justification:**
   ```
   Subject: YouTube Upload Scope Justification for Reframe AI

   Application Name: Reframe AI
   Client ID: [Your Client ID]

   Scope Request:
   - https://www.googleapis.com/auth/youtube.upload
   - https://www.googleapis.com/auth/youtube.force-ssl

   Justification:
   Reframe AI is a video editing platform that helps users create and edit
   video clips. We request YouTube upload permission to allow users to
   automatically publish their edited videos directly to their own YouTube
   channels.

   Users explicitly authorize this action through OAuth 2.0. Videos are
   posted to the user's own channel, not ours. Users maintain full control
   and can disconnect their account at any time.

   We only use these permissions when:
   1. User explicitly clicks "Post to YouTube"
   2. User has already connected their YouTube account
   3. User confirms upload details (title, description, privacy)

   Data Handling:
   - We store encrypted access tokens in Firestore
   - Tokens are only used for authorized uploads
   - Users can revoke access anytime
   - We do not access or store video content from YouTube
   - We only upload user-generated content to user's own channel

   See demo video: [YouTube video link]
   Privacy Policy: [Link]
   Terms of Service: [Link]
   ```

3. **Ensure Privacy Policy includes:**
   - How you use YouTube data
   - What data you store (access tokens)
   - How users can revoke access
   - Data retention policy
   - Contact information

### Step 2: Submit for Verification

1. Go to OAuth consent screen
2. Click **"Submit for Verification"**
3. Fill out the form:
   - Paste your justification
   - Add demo video link
   - Add privacy policy link
   - Add terms of service link
4. Submit

### Step 3: Wait for Response

- **Timeline**: 2-4 weeks (sometimes faster)
- **Response**: Email to your developer contact email
- **Possible outcomes**:
  - ✅ **Approved**: App is verified, no warnings for users
  - ⚠️ **Additional Info Needed**: Google requests more documentation
  - ❌ **Rejected**: Need to modify app or scopes

---

## Quick Launch Strategy

For fastest time to market:

### Phase 1: Testing Mode (Current)
- Add key users as test users
- Beta test the feature
- Gather feedback
- Duration: As long as needed

### Phase 2: Published but Unverified
- Publish app (takes 5 minutes)
- Users see warning but can still authorize
- Most users will authorize if they trust your brand
- Good for early adopters
- Duration: Until verification completes

### Phase 3: Verified
- Submit for verification
- Wait 2-4 weeks
- Once verified, no warnings for users
- Best user experience

### Recommendation:
1. **Start with Phase 2** (published but unverified)
2. **Submit for verification** in parallel
3. **Monitor user conversion** (% who authorize despite warning)

---

## Monitoring After Publishing

### Check OAuth Consent Screen Status

1. Go to OAuth consent screen
2. Look for:
   - **Publishing status**: Published / In Production
   - **Verification status**: Verified / Not verified / Pending

### Monitor API Usage

1. Go to **APIs & Services** → **Dashboard**
2. Click **YouTube Data API v3**
3. Monitor:
   - Daily quota usage
   - Error rates
   - Traffic patterns

### YouTube API Quota

- **Daily quota**: 10,000 units
- **Video upload cost**: ~1,600 units per upload
- **Max uploads per day**: ~6 uploads per day
- **Quota reset**: Midnight Pacific Time

To request quota increase:
1. Go to **YouTube Data API v3** page
2. Click **"Quotas"** tab
3. Click **"Request Quota Increase"**
4. Fill out the form (requires justification)

---

## Security Best Practices

### Before Publishing

1. **Review your code**:
   - Ensure tokens are encrypted (✅ already done in your code)
   - Verify token storage is secure (✅ Firestore with proper rules)
   - Check that refresh tokens are handled properly (✅ already implemented)

2. **Review Firestore rules**:
   ```javascript
   // Ensure this is in your firestore.rules
   match /user_social_connections/{connectionId} {
     allow read: if request.auth != null &&
                   request.auth.uid == resource.data.userId;
     allow write: if request.auth != null &&
                    request.auth.uid == request.resource.data.userId;
     allow delete: if request.auth != null &&
                     request.auth.uid == resource.data.userId;
   }
   ```

3. **Review Cloud Function security**:
   - ✅ Authentication checks in place
   - ✅ Rate limiting (consider adding if not present)
   - ✅ Input validation

### After Publishing

1. **Monitor for abuse**
2. **Track API quota usage**
3. **Set up alerts** for quota threshold (e.g., 80%)
4. **Monitor error logs** in Firebase Functions

---

## Cost Considerations

### Free Tier
- YouTube API: Free
- OAuth: Free
- Firebase Functions: First 2M invocations free
- After free tier: ~$0.40 per 1M invocations

### Production Costs (estimated)
- 100 uploads/day: ~$2-5/month (Firebase Functions)
- 1000 uploads/day: ~$20-50/month

### Quota Increase Costs
- YouTube API quota increase: Free to request, usually approved
- No direct costs, but Google may review your app

---

## Troubleshooting After Publishing

### Users Still Can't Authorize

**Check:**
1. App is actually published (not in testing)
2. Redirect URIs match exactly
3. Scopes are configured correctly
4. Cloud Functions are deployed and running

### "Invalid Client" Error

**Cause**: Client ID mismatch

**Solution**:
1. Verify Client ID in `.env` files
2. Check Firebase Functions secrets:
   ```bash
   firebase functions:config:get
   ```
3. Redeploy if needed

### Token Refresh Failing

**Cause**: User revoked access or refresh token expired

**Solution**:
1. Catch the error in `refreshYouTubeToken` function
2. Prompt user to reconnect YouTube account
3. Already handled in `functions/src/index.ts:272`

---

## Next Steps After Publishing

1. ✅ **Publish your app** (5 minutes)
2. ✅ **Test with non-test user** (5 minutes)
3. ⏳ **Submit for verification** (optional, parallel)
4. 📊 **Monitor usage and errors**
5. 🚀 **Market your feature!**

---

## Resources

- [Google OAuth Verification Process](https://support.google.com/cloud/answer/9110914)
- [YouTube API Quota](https://developers.google.com/youtube/v3/getting-started#quota)
- [OAuth Consent Screen Setup](https://support.google.com/cloud/answer/10311615)
- [Domain Verification](https://support.google.com/cloud/answer/9110914#verify-domain)

---

## Summary

The main issue causing "unauthorized" errors is that your app is in **Testing mode**.

**Quick fix (5 minutes):**
1. Go to Google Cloud Console
2. OAuth consent screen
3. Click "Publish App"
4. Click "Confirm"
5. Test with a non-test user

**Users will see**:
- "This app hasn't been verified by Google"
- But they CAN authorize by clicking "Advanced" → "Go to Reframe AI (unsafe)"

**For best experience (2-4 weeks):**
- Submit for verification
- Once verified, no warnings for users

**You can launch immediately** with published but unverified status. Most users will authorize if they trust your app!
