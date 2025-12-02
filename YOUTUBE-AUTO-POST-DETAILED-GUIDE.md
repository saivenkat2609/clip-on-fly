# YouTube Auto-Post Feature - Complete Implementation Guide

## Understanding How OAuth Works (Posting on Behalf of Users)

### The Concept

When you implement YouTube auto-post, you're **NOT posting from your own YouTube account**. Instead:

1. **User authorizes your app** to post on their behalf
2. **YouTube gives your app permission** (access token) to act as that user
3. **Your app posts to the user's YouTube channel** using their permission
4. **Each user connects their own YouTube account** - videos go to their channels

Think of it like this:
- ❌ NOT: Your app → Your YouTube account → User's video
- ✅ YES: Your app → User's YouTube account → User's video

---

## How the Flow Works Step-by-Step

### Step 1: User Clicks "Connect YouTube"
```
User in your app → Clicks "Connect YouTube" button
```

### Step 2: Redirect to Google
```
Your app → Redirects user to Google OAuth page
User sees: "Reframe AI wants to upload videos to your YouTube channel"
```

### Step 3: User Authorizes
```
User → Clicks "Allow"
Google → Gives your app an ACCESS TOKEN for this specific user
```

### Step 4: Store Token
```
Your app → Stores the access token in Firestore
Now your app can post to THIS user's YouTube channel
```

### Step 5: Upload Video
```
User → Clicks "Post to YouTube"
Your app → Uses the stored access token
YouTube → Posts video to the USER'S channel (not yours!)
```

### Important: Each User Gets Their Own Token
- User A connects → Gets Token A → Posts to User A's channel
- User B connects → Gets Token B → Posts to User B's channel
- Tokens are user-specific and channel-specific

---

## Complete Implementation Steps

## Part 1: Google Cloud Setup (15 minutes)

### Step 1.1: Create Google Cloud Project

1. **Open Google Cloud Console**
   - Go to: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create New Project**
   - Click the project dropdown (top left, next to "Google Cloud")
   - Click "NEW PROJECT"
   - Project name: `reframe-ai-youtube` (or any name)
   - Organization: Leave as "No organization"
   - Location: Leave as default
   - Click "CREATE"
   - Wait 20-30 seconds for project creation

3. **Select Your Project**
   - Click the project dropdown again
   - Select your newly created project "reframe-ai-youtube"
   - Verify you're in the correct project (top left shows project name)

---

### Step 1.2: Enable YouTube Data API v3

1. **Navigate to API Library**
   - Click "☰" (hamburger menu, top left)
   - Scroll down to "APIs & Services"
   - Click "Library"

2. **Find YouTube API**
   - In the search bar, type: `YouTube Data API v3`
   - Click on "YouTube Data API v3" from results

3. **Enable the API**
   - Click the blue "ENABLE" button
   - Wait 10-15 seconds for activation
   - You'll see "API enabled" with a green checkmark

---

### Step 1.3: Configure OAuth Consent Screen

This is what users see when they authorize your app.

1. **Navigate to OAuth Consent Screen**
   - Click "☰" (hamburger menu)
   - Go to "APIs & Services" → "OAuth consent screen"

2. **Choose User Type**
   - Select "External" (allows any Google user to connect)
   - Click "CREATE"

3. **Fill App Information (Page 1)**
   - **App name**: `Reframe AI` (shows to users)
   - **User support email**: Your email address
   - **App logo**: (Optional) Upload your logo
   - **App domain**: (Optional for testing)
   - **Authorized domains**: (Leave empty for now, add later for production)
   - **Developer contact information**: Your email
   - Click "SAVE AND CONTINUE"

4. **Add Scopes (Page 2)**
   - Click "ADD OR REMOVE SCOPES"
   - In the filter box, type: `youtube`
   - Find and check these TWO scopes:
     - ✅ `https://www.googleapis.com/auth/youtube.upload`
       - Description: "Upload videos to your YouTube account"
     - ✅ `https://www.googleapis.com/auth/youtube.force-ssl`
       - Description: "See, edit, and permanently delete your YouTube videos"
   - Click "UPDATE" at the bottom
   - Verify you see 2 scopes added
   - Click "SAVE AND CONTINUE"

5. **Add Test Users (Page 3)**
   - While in development, only test users can authorize your app
   - Click "ADD USERS"
   - Enter your email address (and any other testers)
   - Click "ADD"
   - Click "SAVE AND CONTINUE"

6. **Review Summary (Page 4)**
   - Review all information
   - Click "BACK TO DASHBOARD"

**Important Note**: Your app is now in "Testing" mode. Only test users can connect. To allow anyone to connect, you'll need to publish the app later (submit for verification).

---

### Step 1.4: Create OAuth 2.0 Credentials

These are the "keys" your app uses to authenticate with Google.

1. **Navigate to Credentials**
   - Click "☰" (hamburger menu)
   - Go to "APIs & Services" → "Credentials"

2. **Create OAuth Client ID**
   - Click "CREATE CREDENTIALS" (top)
   - Select "OAuth client ID"

3. **Configure Application**
   - Application type: Select "Web application"
   - Name: `Reframe AI Web Client` (internal name, users won't see this)

4. **Add Authorized JavaScript Origins**
   - Click "ADD URI" under "Authorized JavaScript origins"
   - Add: `http://localhost:5173` (for local development)
   - Click "ADD URI" again
   - Add: `https://yourdomain.com` (your production domain, if you have it)

5. **Add Authorized Redirect URIs**
   - Click "ADD URI" under "Authorized redirect URIs"
   - Add: `http://localhost:5173/auth/youtube/callback`
   - Click "ADD URI" again
   - Add: `https://yourdomain.com/auth/youtube/callback`
   - These are the URLs Google will redirect users back to after authorization

6. **Create**
   - Click "CREATE"
   - A popup will show your credentials

7. **Save Your Credentials**
   - You'll see:
     - **Client ID**: Something like `123456789-abc123.apps.googleusercontent.com`
     - **Client Secret**: Something like `GOCSPX-abc123xyz789`
   - **COPY BOTH** - you'll need these!
   - Click "DOWNLOAD JSON" (optional, for backup)
   - Click "OK"

---

### Step 1.5: Store Credentials in Your Project

1. **Open your project folder**
   - Navigate to: `C:\Projects\reframe-ai`

2. **Open or create `.env.local` file**
   - If it doesn't exist, create it in the root directory
   - Add these lines:

```env
# YouTube OAuth Credentials
VITE_YOUTUBE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
VITE_YOUTUBE_CLIENT_SECRET=your-client-secret-here
```

3. **Replace with your actual credentials**
   - Replace `your-client-id-here` with your actual Client ID
   - Replace `your-client-secret-here` with your actual Client Secret

4. **Add to .gitignore**
   - Make sure `.env.local` is in your `.gitignore` file
   - This prevents accidentally committing secrets to Git

---

## Part 2: Backend Setup (Firebase Cloud Functions)

### Step 2.1: Install Required Packages

```bash
# In your project root
npm install googleapis
```

```bash
# In your functions directory
cd functions
npm install googleapis crypto-js
cd ..
```

---

### Step 2.2: Set Up Firebase Functions Configuration

Set your YouTube credentials in Firebase:

```bash
firebase functions:config:set youtube.client_id="YOUR_CLIENT_ID_HERE"
firebase functions:config:set youtube.client_secret="YOUR_CLIENT_SECRET_HERE"
firebase functions:config:set encryption.key="YOUR_RANDOM_ENCRYPTION_KEY_HERE"
```

**Generate a random encryption key:**
```bash
# Run this in Node.js or online
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Step 2.3: Update Firestore Security Rules

Open `firestore.rules` and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Existing rules...

    // Social media connections
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

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

---

### Step 2.4: Create Cloud Functions

Create or update `functions/src/index.ts`:

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';
import * as CryptoJS from 'crypto-js';
import axios from 'axios';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Get encryption key from Firebase config
const ENCRYPTION_KEY = functions.config().encryption?.key || 'default-key-change-me';

// Encryption utilities
function encryptToken(token: string): string {
  return CryptoJS.AES.encrypt(token, ENCRYPTION_KEY).toString();
}

function decryptToken(encryptedToken: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedToken, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Get OAuth2 client
function getOAuth2Client(redirectUri?: string) {
  return new google.auth.OAuth2(
    functions.config().youtube?.client_id,
    functions.config().youtube?.client_secret,
    redirectUri
  );
}

/**
 * Step 1: Generate YouTube OAuth URL
 * Called from frontend when user clicks "Connect YouTube"
 */
export const getYouTubeAuthUrl = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userId = context.auth.uid;
  const redirectUri = data.redirectUri || 'http://localhost:5173/auth/youtube/callback';

  const oauth2Client = getOAuth2Client(redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Gets refresh token
    scope: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.force-ssl'
    ],
    state: userId, // Pass userId to identify user after redirect
    prompt: 'consent' // Force consent screen to get refresh token
  });

  return { authUrl };
});

/**
 * Step 2: Handle OAuth Callback
 * Called when Google redirects user back to your app
 */
export const youtubeOAuthCallback = functions.https.onRequest(async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    res.status(400).send('Missing authorization code or state parameter');
    return;
  }

  const userId = state as string;
  const redirectUri = `${req.protocol}://${req.get('host')}/youtubecallback`;

  try {
    // Exchange authorization code for tokens
    const oauth2Client = getOAuth2Client(redirectUri);
    const { tokens } = await oauth2Client.getToken(code as string);

    if (!tokens.access_token) {
      throw new Error('No access token received');
    }

    // Set credentials to make API calls
    oauth2Client.setCredentials(tokens);

    // Get user's YouTube channel information
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const channelResponse = await youtube.channels.list({
      part: ['snippet', 'contentDetails'],
      mine: true
    });

    const channel = channelResponse.data.items?.[0];

    if (!channel) {
      throw new Error('No YouTube channel found for this account');
    }

    // Check if connection already exists
    const existingConnections = await db
      .collection('user_social_connections')
      .where('userId', '==', userId)
      .where('platform', '==', 'youtube')
      .where('platformUserId', '==', channel.id)
      .get();

    // Prepare connection data
    const connectionData = {
      userId,
      platform: 'youtube',
      accessToken: encryptToken(tokens.access_token),
      refreshToken: tokens.refresh_token ? encryptToken(tokens.refresh_token) : null,
      expiresAt: tokens.expiry_date || Date.now() + 3600000, // 1 hour default
      platformUserId: channel.id!,
      platformUsername: channel.snippet?.title || 'Unknown',
      platformThumbnail: channel.snippet?.thumbnails?.default?.url || null,
      connectedAt: Date.now(),
      lastUsed: Date.now(),
      isActive: true
    };

    // Update or create connection
    if (!existingConnections.empty) {
      await existingConnections.docs[0].ref.update(connectionData);
    } else {
      await db.collection('user_social_connections').add(connectionData);
    }

    // Redirect user back to app with success message
    res.redirect('/?youtube=connected&success=true');

  } catch (error: any) {
    console.error('YouTube OAuth callback error:', error);
    res.redirect('/?youtube=error&message=' + encodeURIComponent(error.message));
  }
});

/**
 * Step 3: Refresh Access Token
 * Called automatically when token expires
 */
async function refreshYouTubeToken(connectionDoc: FirebaseFirestore.DocumentSnapshot) {
  const data = connectionDoc.data();

  if (!data || !data.refreshToken) {
    throw new Error('No refresh token available');
  }

  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: decryptToken(data.refreshToken)
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  // Update connection with new tokens
  await connectionDoc.ref.update({
    accessToken: encryptToken(credentials.access_token!),
    expiresAt: credentials.expiry_date,
    lastUsed: Date.now()
  });

  return credentials.access_token!;
}

/**
 * Step 4: Upload Video to YouTube
 * Called when user clicks "Post to YouTube"
 */
export const uploadToYouTube = functions
  .runWith({
    timeoutSeconds: 540, // 9 minutes (max for Firebase Functions)
    memory: '2GB'
  })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const { videoUrl, title, description, tags, privacy, categoryId } = data;
    const userId = context.auth.uid;

    // Validate inputs
    if (!videoUrl || !title) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Video URL and title are required'
      );
    }

    try {
      // Get user's YouTube connection
      const connectionsSnapshot = await db
        .collection('user_social_connections')
        .where('userId', '==', userId)
        .where('platform', '==', 'youtube')
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (connectionsSnapshot.empty) {
        throw new functions.https.HttpsError(
          'not-found',
          'No YouTube connection found. Please connect your YouTube account first.'
        );
      }

      const connectionDoc = connectionsSnapshot.docs[0];
      const connectionData = connectionDoc.data();

      // Check if token is expired
      let accessToken = decryptToken(connectionData.accessToken);

      if (connectionData.expiresAt < Date.now()) {
        console.log('Token expired, refreshing...');
        accessToken = await refreshYouTubeToken(connectionDoc);
      }

      // Set up OAuth client with access token
      const oauth2Client = getOAuth2Client();
      oauth2Client.setCredentials({ access_token: accessToken });

      // Download video from your R2 bucket
      console.log('Downloading video from R2...');
      const videoResponse = await axios.get(videoUrl, {
        responseType: 'stream',
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      });

      // Get video file size
      const contentLength = videoResponse.headers['content-length'];
      console.log(`Video size: ${contentLength} bytes`);

      // Upload to YouTube
      console.log('Uploading to YouTube...');
      const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

      const uploadResponse = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: title.substring(0, 100), // YouTube max 100 chars
            description: description?.substring(0, 5000) || '', // YouTube max 5000 chars
            tags: tags || [],
            categoryId: categoryId || '22', // Default: People & Blogs
            defaultLanguage: 'en',
            defaultAudioLanguage: 'en'
          },
          status: {
            privacyStatus: privacy || 'public', // 'public', 'private', or 'unlisted'
            selfDeclaredMadeForKids: false
          }
        },
        media: {
          body: videoResponse.data
        }
      });

      const videoId = uploadResponse.data.id;
      const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

      // Update last used timestamp
      await connectionDoc.ref.update({
        lastUsed: Date.now()
      });

      console.log(`Successfully uploaded to YouTube: ${youtubeUrl}`);

      return {
        success: true,
        videoId,
        url: youtubeUrl,
        title: uploadResponse.data.snippet?.title,
        channelTitle: uploadResponse.data.snippet?.channelTitle
      };

    } catch (error: any) {
      console.error('YouTube upload error:', error);

      // Handle specific errors
      if (error.code === 403) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'YouTube API quota exceeded or permission denied. Please try again later.'
        );
      }

      if (error.code === 401) {
        throw new functions.https.HttpsError(
          'unauthenticated',
          'YouTube authorization expired. Please reconnect your YouTube account.'
        );
      }

      throw new functions.https.HttpsError(
        'internal',
        `Failed to upload to YouTube: ${error.message}`
      );
    }
  });

/**
 * Step 5: Disconnect YouTube Account
 * Called when user wants to remove connection
 */
export const disconnectYouTube = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userId = context.auth.uid;

  try {
    const connectionsSnapshot = await db
      .collection('user_social_connections')
      .where('userId', '==', userId)
      .where('platform', '==', 'youtube')
      .get();

    const batch = db.batch();
    connectionsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return { success: true };

  } catch (error: any) {
    throw new functions.https.HttpsError(
      'internal',
      `Failed to disconnect YouTube: ${error.message}`
    );
  }
});

/**
 * Get user's connected YouTube channels
 */
export const getYouTubeConnections = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const userId = context.auth.uid;

  const connectionsSnapshot = await db
    .collection('user_social_connections')
    .where('userId', '==', userId)
    .where('platform', '==', 'youtube')
    .where('isActive', '==', true)
    .get();

  const connections = connectionsSnapshot.docs.map(doc => ({
    id: doc.id,
    platformUsername: doc.data().platformUsername,
    platformThumbnail: doc.data().platformThumbnail,
    connectedAt: doc.data().connectedAt
  }));

  return { connections };
});
```

---

### Step 2.5: Deploy Cloud Functions

```bash
# Make sure you're in the project root
firebase deploy --only functions
```

This will deploy:
- `getYouTubeAuthUrl` - Generates OAuth URL
- `youtubeOAuthCallback` - Handles OAuth callback
- `uploadToYouTube` - Uploads video
- `disconnectYouTube` - Removes connection
- `getYouTubeConnections` - Lists connections

**Deployment takes 3-5 minutes.**

After deployment, note your function URLs:
- `https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/youtubeOAuthCallback`

---

## Part 3: Frontend Implementation

### Step 3.1: Update Firebase Config

Make sure `src/lib/firebase.ts` exports functions:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  // Your config...
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
```

---

### Step 3.2: Create YouTube Connection Component

Create `src/components/YouTubeConnection.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../lib/firebase';

interface YouTubeConnection {
  id: string;
  platformUsername: string;
  platformThumbnail: string | null;
  connectedAt: number;
}

export const YouTubeConnection: React.FC = () => {
  const { currentUser } = useAuth();
  const [connections, setConnections] = useState<YouTubeConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Listen to real-time updates
    const q = query(
      collection(db, 'user_social_connections'),
      where('userId', '==', currentUser.uid),
      where('platform', '==', 'youtube'),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as YouTubeConnection));
      setConnections(conns);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Get auth URL from Cloud Function
      const getAuthUrl = httpsCallable(functions, 'getYouTubeAuthUrl');
      const result = await getAuthUrl({
        redirectUri: `${window.location.origin}/auth/youtube/callback`
      });

      const { authUrl } = result.data as { authUrl: string };

      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting YouTube:', error);
      alert('Failed to connect YouTube. Please try again.');
      setConnecting(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Are you sure you want to disconnect your YouTube account?')) {
      return;
    }

    try {
      const disconnectYouTube = httpsCallable(functions, 'disconnectYouTube');
      await disconnectYouTube();
      alert('YouTube account disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting YouTube:', error);
      alert('Failed to disconnect YouTube. Please try again.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">YouTube Connection</h2>
        {connections.length === 0 && (
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {connecting ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <span>▶️</span>
                <span>Connect YouTube</span>
              </>
            )}
          </button>
        )}
      </div>

      {connections.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">No YouTube account connected</p>
          <p className="text-sm">
            Connect your YouTube account to automatically post your videos
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {connections.map(conn => (
            <div
              key={conn.id}
              className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {conn.platformThumbnail ? (
                  <img
                    src={conn.platformThumbnail}
                    alt={conn.platformUsername}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white">
                    ▶️
                  </div>
                )}
                <div>
                  <p className="font-semibold">{conn.platformUsername}</p>
                  <p className="text-sm text-gray-500">
                    Connected {new Date(conn.connectedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDisconnect(conn.id)}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              >
                Disconnect
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> Videos will be posted to your YouTube channel.
          You can manage your videos anytime from YouTube Studio.
        </p>
      </div>
    </div>
  );
};
```

---

### Step 3.3: Create YouTube Post Component

Create `src/components/YouTubePostModal.tsx`:

```typescript
import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

interface YouTubePostModalProps {
  videoUrl: string;
  defaultTitle: string;
  onClose: () => void;
  onSuccess: (youtubeUrl: string) => void;
}

export const YouTubePostModal: React.FC<YouTubePostModalProps> = ({
  videoUrl,
  defaultTitle,
  onClose,
  onSuccess
}) => {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'unlisted' | 'private'>('public');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');

  const handleUpload = async () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }

    setUploading(true);
    setProgress('Preparing upload...');

    try {
      setProgress('Uploading to YouTube...');

      const uploadToYouTube = httpsCallable(functions, 'uploadToYouTube');
      const result = await uploadToYouTube({
        videoUrl,
        title: title.trim(),
        description: description.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        privacy,
        categoryId: '22' // People & Blogs - change if needed
      });

      const data = result.data as any;

      if (data.success) {
        setProgress('Upload successful!');
        setTimeout(() => {
          onSuccess(data.url);
          onClose();
        }, 1000);
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      setProgress('');

      let errorMessage = 'Failed to upload to YouTube';
      if (error.message.includes('quota')) {
        errorMessage = 'YouTube API quota exceeded. Please try again tomorrow.';
      } else if (error.message.includes('not-found')) {
        errorMessage = 'Please connect your YouTube account first';
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Post to YouTube</h2>

        {/* Title */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 100))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            placeholder="Enter video title"
            maxLength={100}
            disabled={uploading}
          />
          <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 5000))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            rows={5}
            placeholder="Enter video description"
            maxLength={5000}
            disabled={uploading}
          />
          <p className="text-xs text-gray-500 mt-1">{description.length}/5000 characters</p>
        </div>

        {/* Tags */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            placeholder="ai, video editing, automation"
            disabled={uploading}
          />
          <p className="text-xs text-gray-500 mt-1">Maximum 500 characters total</p>
        </div>

        {/* Privacy */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Privacy</label>
          <select
            value={privacy}
            onChange={(e) => setPrivacy(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            disabled={uploading}
          >
            <option value="public">Public - Anyone can view</option>
            <option value="unlisted">Unlisted - Only people with link can view</option>
            <option value="private">Private - Only you can view</option>
          </select>
        </div>

        {/* Progress */}
        {progress && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">{progress}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleUpload}
            disabled={uploading || !title.trim()}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Upload to YouTube'}
          </button>
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        {/* Info */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>Note:</strong> Upload may take a few minutes depending on video size.
            YouTube may take additional time to process the video after upload completes.
          </p>
        </div>
      </div>
    </div>
  );
};
```

---

### Step 3.4: Add OAuth Callback Handler

Create `src/pages/YouTubeCallback.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const YouTubeCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      setStatus('error');
      setTimeout(() => navigate('/dashboard?youtube=error'), 2000);
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setTimeout(() => navigate('/dashboard?youtube=error'), 2000);
      return;
    }

    // The Cloud Function handles the token exchange
    // It receives the callback at /youtubecallback
    // We just need to wait for it to complete and redirect
    setStatus('success');
    setTimeout(() => navigate('/dashboard?youtube=connected'), 2000);

  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold mb-2">Connecting YouTube...</h2>
            <p className="text-gray-600 dark:text-gray-400">Please wait</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2">YouTube Connected!</h2>
            <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold mb-2">Connection Failed</h2>
            <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
};
```

---

### Step 3.5: Update App Routes

Update `src/App.tsx`:

```typescript
import { YouTubeCallback } from './pages/YouTubeCallback';

// In your Routes:
<Route path="/auth/youtube/callback" element={<YouTubeCallback />} />
```

---

### Step 3.6: Integrate into Dashboard/Settings

Update your Dashboard or Settings page to include YouTube connection:

```typescript
import { YouTubeConnection } from '../components/YouTubeConnection';

// In your component:
<YouTubeConnection />
```

---

### Step 3.7: Integrate into Project Details

Update `src/pages/ProjectDetails.tsx` to add YouTube post button:

```typescript
import { YouTubePostModal } from '../components/YouTubePostModal';

// In your component:
const [showYouTubePost, setShowYouTubePost] = useState(false);

// Add button near your video:
<button
  onClick={() => setShowYouTubePost(true)}
  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
>
  Post to YouTube
</button>

{showYouTubePost && (
  <YouTubePostModal
    videoUrl={currentVideo.url}
    defaultTitle={currentVideo.title}
    onClose={() => setShowYouTubePost(false)}
    onSuccess={(youtubeUrl) => {
      alert(`Successfully posted to YouTube! ${youtubeUrl}`);
      setShowYouTubePost(false);
    }}
  />
)}
```

---

## Part 4: Update Firebase Function URL

The OAuth callback needs to point to your Cloud Function URL.

### Step 4.1: Get Your Function URL

After deploying functions, find your URL:
```bash
firebase functions:list
```

Look for `youtubeOAuthCallback` and note the URL, e.g.:
```
https://us-central1-your-project-id.cloudfunctions.net/youtubeOAuthCallback
```

### Step 4.2: Update Google Cloud OAuth Settings

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to "APIs & Services" → "Credentials"
4. Click on your OAuth 2.0 Client ID
5. Under "Authorized redirect URIs", add:
   - `https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/youtubeOAuthCallback`
6. Click "Save"

---

## Part 5: Testing

### Step 5.1: Test OAuth Flow

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to Dashboard/Settings**
3. **Click "Connect YouTube"**
4. **You should see:**
   - Redirect to Google login page
   - "Reframe AI wants to upload videos to your YouTube channel"
   - Click "Allow"
   - Redirect back to your app
   - See "YouTube Connected" message

5. **Verify in Firestore:**
   - Open Firebase Console
   - Go to Firestore Database
   - Find `user_social_connections` collection
   - See your new connection document

---

### Step 5.2: Test Video Upload

1. **Go to a processed video in Project Details**
2. **Click "Post to YouTube"**
3. **Fill in:**
   - Title: "Test Video Upload"
   - Description: "Testing auto-post feature"
   - Tags: "test, automation"
   - Privacy: "Unlisted" (for testing)
4. **Click "Upload to YouTube"**
5. **Wait for upload (30 seconds - 2 minutes depending on video size)**
6. **Check YouTube:**
   - Go to https://studio.youtube.com
   - See your uploaded video
   - Verify title, description, tags

---

### Step 5.3: Test Error Scenarios

**Test 1: Upload without connection**
- Disconnect YouTube account
- Try to upload
- Should see: "Please connect your YouTube account first"

**Test 2: Token expiration**
- Wait for token to expire (1 hour)
- Try to upload
- Should automatically refresh token and upload

**Test 3: Invalid video URL**
- Try uploading with a broken URL
- Should see error message

---

## Part 6: Production Deployment

### Step 6.1: Publish OAuth Consent Screen

Your app is currently in "Testing" mode (only test users can connect).

To allow any user to connect:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Go to "APIs & Services" → "OAuth consent screen"
3. Click "PUBLISH APP"
4. Review warning (app will be available to all Google users)
5. Click "CONFIRM"

**Note:** If you use sensitive or restricted scopes, you may need to go through Google's verification process (can take weeks).

---

### Step 6.2: Update Production URLs

1. **Add production redirect URI:**
   - Go to "APIs & Services" → "Credentials"
   - Click your OAuth client
   - Add: `https://yourdomain.com/auth/youtube/callback`
   - Add: `https://us-central1-YOUR-PROJECT-ID.cloudfunctions.net/youtubeOAuthCallback`
   - Save

2. **Deploy to production:**
   ```bash
   npm run build
   firebase deploy
   ```

---

## Part 7: Monitoring & Troubleshooting

### Check Cloud Function Logs

```bash
firebase functions:log
```

Or in Firebase Console:
- Go to "Functions"
- Click function name
- Click "Logs" tab

### Common Issues

**Issue 1: "Access blocked: This app's request is invalid"**
- Solution: Make sure redirect URI exactly matches what's in Google Cloud Console

**Issue 2: "No refresh token"**
- Solution: Add `prompt: 'consent'` to OAuth URL (already in code above)

**Issue 3: "Quota exceeded"**
- Solution: YouTube allows ~6-7 uploads per day per user. Wait 24 hours.

**Issue 4: "Token expired"**
- Solution: The code should auto-refresh. Check refresh token exists in Firestore.

**Issue 5: Upload times out**
- Solution: Increase Cloud Function timeout (already set to 9 minutes in code)

---

## Usage Limits

### YouTube Data API Quota

- **Default daily quota**: 10,000 units
- **Video upload cost**: ~1,600 units
- **Maximum free uploads per day**: 6-7 videos
- **Quota resets**: Midnight Pacific Time

### File Size Limits

- **Maximum file size**: 256GB (you'll never hit this)
- **Maximum duration**: 12 hours (way more than you need)

### Recommendations

- Keep videos under 500MB for faster uploads
- Optimal length: 30 seconds - 10 minutes for shorts/clips
- Use MP4 format with H.264 codec

---

## Summary: What You've Built

1. ✅ Users can connect their YouTube accounts via OAuth
2. ✅ Your app securely stores encrypted access tokens
3. ✅ Users can upload videos directly to THEIR YouTube channels
4. ✅ Videos post with custom titles, descriptions, tags
5. ✅ Automatic token refresh when expired
6. ✅ Real-time connection status
7. ✅ Disconnect functionality

## Complete Flow Diagram

```
User clicks "Connect YouTube"
    ↓
Your app calls getYouTubeAuthUrl Cloud Function
    ↓
Redirect to Google OAuth page
    ↓
User authorizes app
    ↓
Google redirects to your Cloud Function
    ↓
Cloud Function exchanges code for tokens
    ↓
Cloud Function saves encrypted tokens to Firestore
    ↓
User sees "Connected" status
    ↓
User clicks "Post to YouTube"
    ↓
Your app calls uploadToYouTube Cloud Function
    ↓
Cloud Function downloads video from R2
    ↓
Cloud Function uploads to YouTube using user's token
    ↓
Video appears on USER'S YouTube channel
```

---

## Cost Analysis

### Development Phase (Testing)
- **Google Cloud**: Free
- **YouTube API**: Free (quota included)
- **Firebase Functions**: Free tier (up to 2M invocations)
- **Firebase Firestore**: Free tier (up to 50K reads/day)
- **Total**: $0

### Production Phase (per month)
- **Google Cloud**: Free
- **YouTube API**: Free
- **Firebase Functions**: ~$5-10 (depending on usage)
- **Firebase Firestore**: ~$1-5 (depending on users)
- **Total**: ~$6-15/month for small/medium usage

---

## Next Steps

1. **Test with your own account** - Upload a test video
2. **Add analytics** - Track how many videos users post
3. **Add scheduling** - Let users schedule posts for later
4. **Add thumbnails** - Let users customize thumbnail
5. **Add playlists** - Let users add videos to playlists
6. **Add Instagram, TikTok, etc.** - Follow similar pattern

---

## Support & Resources

- **YouTube API Documentation**: https://developers.google.com/youtube/v3
- **OAuth 2.0 Guide**: https://developers.google.com/identity/protocols/oauth2
- **Firebase Functions**: https://firebase.google.com/docs/functions
- **googleapis npm**: https://www.npmjs.com/package/googleapis

You're all set! Start with testing locally, then move to production. Good luck! 🚀
