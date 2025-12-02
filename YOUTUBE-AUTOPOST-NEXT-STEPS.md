# YouTube Auto-Post Feature - Next Steps

## ✅ What Has Been Implemented

I've successfully implemented the complete YouTube auto-post feature in your application! Here's what's been added:

### Frontend Components Created:
1. **YouTubeConnection.tsx** - Component to connect/disconnect YouTube accounts
2. **YouTubePostModal.tsx** - Modal to post videos to YouTube with title, description, tags, and privacy settings
3. **YouTubeCallback.tsx** - OAuth callback page for YouTube authentication
4. **Updated Settings page** - Added "Social" tab with YouTube connection
5. **Updated ProjectDetails page** - Added "Post to YouTube" button on each clip
6. **Updated App.tsx** - Added OAuth callback route
7. **Updated firebase.ts** - Exported Firebase Functions

### Backend Infrastructure Created:
1. **Firebase Cloud Functions** (functions/src/index.ts):
   - `getYouTubeAuthUrl` - Generates OAuth URL
   - `youtubeOAuthCallback` - Handles OAuth callback
   - `uploadToYouTube` - Uploads video to YouTube
   - `disconnectYouTube` - Removes connection
   - `getYouTubeConnections` - Lists connections

2. **Security Rules** (firestore.rules):
   - Added rules for `user_social_connections` collection
   - Proper authentication and authorization

3. **Firebase Config** (firebase.json):
   - Configured functions deployment
   - Configured Firestore and hosting

---

## 🚀 What You Need to Do Now

Follow these steps **in order** to make the feature work:

### Step 1: Install Required NPM Packages

Run these commands:

```bash
# Install frontend dependencies
npm install

# Install Firebase Functions dependencies
cd functions
npm install
cd ..
```

### Step 2: Google Cloud Setup (15-20 minutes)

#### 2.1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project"
3. Name: `reframe-ai-youtube` (or any name)
4. Click "CREATE"
5. Wait for project creation
6. Select your new project from the dropdown

#### 2.2: Enable YouTube Data API v3

1. Click "☰" (hamburger menu) → "APIs & Services" → "Library"
2. Search: `YouTube Data API v3`
3. Click on it → Click "ENABLE"

#### 2.3: Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" → Click "CREATE"
3. Fill in:
   - **App name**: Reframe AI
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Click "SAVE AND CONTINUE"

5. On "Scopes" page:
   - Click "ADD OR REMOVE SCOPES"
   - Search: `youtube`
   - Check these TWO scopes:
     - ✅ `https://www.googleapis.com/auth/youtube.upload`
     - ✅ `https://www.googleapis.com/auth/youtube.force-ssl`
   - Click "UPDATE"
   - Click "SAVE AND CONTINUE"

6. On "Test users" page:
   - Click "ADD USERS"
   - Add your email (for testing)
   - Click "ADD"
   - Click "SAVE AND CONTINUE"

7. Click "BACK TO DASHBOARD"

#### 2.4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "CREATE CREDENTIALS" → "OAuth client ID"
3. Application type: **Web application**
4. Name: `Reframe AI Web Client`

5. **Authorized JavaScript origins**:
   - Add: `http://localhost:5173`
   - Add: `https://yourdomain.com` (if you have production domain)

6. **Authorized redirect URIs**:
   - Add: `http://localhost:5173/auth/youtube/callback`
   - Add: `https://yourdomain.com/auth/youtube/callback` (if you have production domain)
   - Add: `https://us-central1-YOUR-FIREBASE-PROJECT-ID.cloudfunctions.net/youtubeOAuthCallback`
     - Replace `YOUR-FIREBASE-PROJECT-ID` with your actual Firebase project ID

7. Click "CREATE"
8. **COPY YOUR CLIENT ID AND CLIENT SECRET** - You'll need these!

### Step 3: Update Environment Variables

Add these to your `.env.local` file:

```env
# YouTube OAuth Credentials
VITE_YOUTUBE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
VITE_YOUTUBE_CLIENT_SECRET=your-client-secret-here
```

Replace with your actual credentials from Step 2.4.

### Step 4: Generate Encryption Key

You need a secure random encryption key for storing YouTube tokens.

**Option 1 - Using Node.js** (Recommended):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2 - Using Online Generator**:
- Go to: https://www.random.org/strings/
- Set length to 64 characters
- Use hex characters (0-9, a-f)
- Generate and copy

**Save this key somewhere safe** - you'll need it in the next step.

Example output: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2`

### Step 5: Deploy Firestore Rules via Firebase Console

#### 5.1: Copy Firestore Rules

Open the file `firestore.rules` in your project. Copy all the content.

#### 5.2: Deploy via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **"Firestore Database"** in the left sidebar
4. Click the **"Rules"** tab at the top
5. **Replace all content** with the rules from `firestore.rules`
6. Click **"Publish"**
7. Wait for "Rules published successfully" message

#### 5.3: Create Firestore Indexes

1. While in Firestore Database, click the **"Indexes"** tab
2. Click **"Add Index"**
3. Fill in:
   - **Collection ID**: `user_social_connections`
   - **Fields to index**:
     - Field: `userId`, Order: Ascending
     - Field: `platform`, Order: Ascending
     - Field: `isActive`, Order: Ascending
   - **Query scope**: Collection
4. Click **"Create"**
5. Wait 1-2 minutes for index to build

### Step 6: Deploy Cloud Functions via Firebase Console

**IMPORTANT**: Cloud Functions require the **Blaze (Pay-as-you-go) plan**. Don't worry - it has a generous free tier that covers your usage ($0/month for typical use).

**👉 Follow this guide first**: [FIREBASE-BLAZE-SETUP.md](./FIREBASE-BLAZE-SETUP.md) (~5 minutes)

After upgrading to Blaze plan, continue below:

#### 6.1: Build Functions Locally

First, install dependencies and build the functions:

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Go back to root
cd ..
```

This creates compiled JavaScript files in `functions/lib/` folder.

#### 6.2: Set Environment Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click **"Functions"** in the left sidebar
4. Click on the **gear icon ⚙️** (Settings) next to "Dashboard"
5. Scroll to **"Environment configuration"** section
6. Click **"Add variable"** for each of these:

   **Variable 1:**
   - Key: `youtube.client_id`
   - Value: Your YouTube Client ID from Step 2.4

   **Variable 2:**
   - Key: `youtube.client_secret`
   - Value: Your YouTube Client Secret from Step 2.4

   **Variable 3:**
   - Key: `encryption.key`
   - Value: The encryption key you generated in Step 4

7. Click **"Save"**

#### 6.3: Deploy Functions Manually

**Option A: Using Firebase Console (Recommended)**

Unfortunately, Firebase Console doesn't support direct manual upload. You'll need to use Firebase CLI for initial deployment.

**Install Firebase CLI (One-time only)**:
```bash
npm install -g firebase-tools
```

**Login to Firebase**:
```bash
firebase login
```

**Deploy Functions**:
```bash
firebase deploy --only functions
```

**Note**: After the first deployment, you can edit functions directly in Firebase Console if needed.

#### 6.4: Alternative - Deploy via CI/CD

If you prefer not to use CLI locally, you can set up GitHub Actions (see CI/CD section at bottom of this file).

After deployment, you'll see your functions in Firebase Console → Functions with URLs like:
```
https://us-central1-your-project-id.cloudfunctions.net/getYouTubeAuthUrl
https://us-central1-your-project-id.cloudfunctions.net/youtubeOAuthCallback
https://us-central1-your-project-id.cloudfunctions.net/uploadToYouTube
```

### Step 7: Update Google OAuth Redirect URI (Important!)

After deploying functions:

1. Copy the `youtubeOAuthCallback` function URL
2. Go back to [Google Cloud Console](https://console.cloud.google.com/)
3. Go to "APIs & Services" → "Credentials"
4. Click your OAuth client
5. Under "Authorized redirect URIs", add:
   - `https://us-central1-YOUR-PROJECT.cloudfunctions.net/youtubeOAuthCallback`
6. Click "SAVE"

### Step 8: Test the Feature!

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Navigate to Settings**:
   - Go to http://localhost:5173/settings
   - Click the "Social" tab

3. **Connect YouTube**:
   - Click "Connect YouTube Account"
   - Sign in with Google
   - Authorize the app
   - You should be redirected back to Settings
   - You should see "YouTube Connected" status

4. **Post a Video**:
   - Go to Dashboard
   - Click on a project with completed clips
   - On any clip, click "Post to YouTube"
   - Fill in title, description, tags
   - Select privacy (Public/Unlisted/Private)
   - Click "Upload to YouTube"
   - Wait for upload to complete

5. **Verify on YouTube**:
   - Go to https://studio.youtube.com
   - Check your videos - the uploaded clip should be there!

---

## 🎯 Testing Checklist

- [ ] YouTube connection shows in Settings → Social tab
- [ ] Can connect YouTube account successfully
- [ ] OAuth redirects work properly
- [ ] Connection status shows with channel name
- [ ] Can open YouTube post modal from ProjectDetails
- [ ] Can fill in video title, description, tags, privacy
- [ ] Upload shows progress indicators
- [ ] Upload completes successfully
- [ ] Video appears in YouTube Studio
- [ ] Can disconnect YouTube account
- [ ] After disconnect, connection is removed

---

## 📊 Quota & Limits

### YouTube API Quota
- **Free daily quota**: 10,000 units
- **Video upload cost**: ~1,600 units
- **Maximum free uploads per day**: 6-7 videos per user
- **Quota resets**: Midnight Pacific Time

### File Size & Duration Limits
- **Maximum file size**: 256GB (you won't hit this)
- **Maximum duration**: 12 hours
- **Recommended**: Keep videos under 500MB for faster uploads

---

## 🐛 Troubleshooting

### Issue: "Access blocked: This app's request is invalid"
**Solution**: Make sure the redirect URI in Google Cloud Console **exactly matches** the one being used.

### Issue: "No refresh token"
**Solution**: The code uses `prompt: 'consent'` which forces refresh token. If still not working, disconnect and reconnect.

### Issue: "Quota exceeded"
**Solution**: YouTube API has daily limits. Wait 24 hours or request quota increase from Google.

### Issue: "Token expired"
**Solution**: The code automatically refreshes tokens. If this fails, ask user to reconnect.

### Issue: Upload times out
**Solution**: Function timeout is set to 9 minutes (maximum). For very large files, consider increasing to max or splitting video.

### Issue: Can't see Cloud Function logs
**Solution**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click "Functions" in left sidebar
4. Click on any function name
5. Click "Logs" tab to see execution logs

Or use CLI: `firebase functions:log`

---

## 🔐 Security Notes

- ✅ Access tokens are encrypted before storing in Firestore
- ✅ Tokens are encrypted using AES encryption
- ✅ Firestore rules ensure users can only access their own connections
- ✅ OAuth tokens are scoped to only YouTube upload permissions
- ✅ Users can disconnect and revoke access anytime
- ✅ No access to user's YouTube password or other Google services

---

## 📈 Future Enhancements (Optional)

1. **Add scheduling**: Let users schedule posts for later
2. **Add thumbnails**: Let users upload custom thumbnails
3. **Add playlists**: Let users add videos to playlists
4. **Add analytics**: Show YouTube video performance
5. **Add Instagram/TikTok**: Follow the same pattern for other platforms
6. **Batch upload**: Upload multiple clips at once

---

## 🎉 You're Done!

Once you complete Steps 1-7 above, your YouTube auto-post feature will be fully functional!

**Estimated total setup time**: 30-40 minutes

If you encounter any issues, check:
1. **Firebase Functions logs**: Firebase Console → Functions → Click function → Logs tab
2. **Browser console**: Press F12 and check Console tab for errors
3. **Firestore rules**: Firebase Console → Firestore Database → Rules tab
4. **Environment config**: Firebase Console → Functions → Settings → Environment configuration
5. **Function deployment status**: Firebase Console → Functions → Check if all 5 functions are deployed

Good luck! 🚀

---

## 🤖 CI/CD Setup (Optional - Alternative to CLI)

If you want to avoid using CLI locally, you can set up GitHub Actions to auto-deploy:

### Create `.github/workflows/firebase-deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [main]
  workflow_dispatch:  # Allows manual trigger

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install frontend dependencies
        run: npm ci

      - name: Install functions dependencies
        run: cd functions && npm ci

      - name: Build functions
        run: cd functions && npm run build

      - name: Build frontend
        run: npm run build

      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          projectId: your-firebase-project-id
```

### Setup Steps:

1. **Generate Service Account Key**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file

2. **Add to GitHub Secrets**:
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: Paste entire JSON content
   - Click "Add secret"

3. **Push to GitHub**:
   - Every push to main branch will auto-deploy
   - Or manually trigger from GitHub Actions tab

This way you never need to use Firebase CLI locally! 🎉
