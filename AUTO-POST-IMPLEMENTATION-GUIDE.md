# Auto-Post Feature Implementation Guide

## Complete Step-by-Step Implementation

This guide walks you through implementing social media auto-posting in your Reframe AI application.

---

## Phase 1: Platform Registration & API Setup

### Step 1.1: YouTube API Setup (Start Here - Easiest)

#### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project" (top right)
3. Project name: "Reframe AI YouTube Integration"
4. Click "Create"
5. Wait for project creation (30 seconds)

#### 2. Enable YouTube Data API v3
1. In the project dashboard, click "Enable APIs and Services"
2. Search for "YouTube Data API v3"
3. Click on it and press "Enable"
4. Wait for activation

#### 3. Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type
3. Click "Create"
4. Fill in required fields:
   - App name: "Reframe AI"
   - User support email: your email
   - Developer contact: your email
5. Click "Save and Continue"
6. On "Scopes" page:
   - Click "Add or Remove Scopes"
   - Search for "YouTube"
   - Select: `https://www.googleapis.com/auth/youtube.upload`
   - Select: `https://www.googleapis.com/auth/youtube.force-ssl`
   - Click "Update" and "Save and Continue"
7. Add test users (your email for testing)
8. Click "Save and Continue"

#### 4. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Application type: "Web application"
4. Name: "Reframe AI Web Client"
5. Authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - `https://yourdomain.com` (for production)
6. Authorized redirect URIs:
   - `http://localhost:5173/auth/youtube/callback`
   - `https://yourdomain.com/auth/youtube/callback`
7. Click "Create"
8. **SAVE YOUR CLIENT ID AND CLIENT SECRET** - you'll need these

#### 5. Store Credentials Securely
Create a `.env.local` file (if not exists):
```env
VITE_YOUTUBE_CLIENT_ID=your-client-id-here
YOUTUBE_CLIENT_SECRET=your-client-secret-here
```

---

### Step 1.2: Instagram API Setup

#### 1. Create Meta App
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click "My Apps" > "Create App"
3. Use case: "Other"
4. App type: "Business"
5. App name: "Reframe AI"
6. Contact email: your email
7. Click "Create App"

#### 2. Add Instagram Product
1. In app dashboard, find "Instagram" product
2. Click "Set Up"
3. Go to "Instagram Basic Display" or "Instagram Graph API"

#### 3. Configure Basic Settings
1. Go to "Settings" > "Basic"
2. Add "Privacy Policy URL" (required)
3. Add "Terms of Service URL" (optional but recommended)
4. Add "App Domains": your domain
5. Save changes

#### 4. Configure Instagram Settings
1. Go to "Instagram" > "Basic Display" > "Settings"
2. Add OAuth Redirect URIs:
   - `http://localhost:5173/auth/instagram/callback`
   - `https://yourdomain.com/auth/instagram/callback`
3. Deauthorize Callback URL: `https://yourdomain.com/auth/instagram/deauthorize`
4. Data Deletion Request URL: `https://yourdomain.com/auth/instagram/delete`
5. Save changes
6. **SAVE YOUR INSTAGRAM APP ID AND APP SECRET**

#### 5. Submit for App Review (Required for Production)
1. Go to "App Review" > "Permissions and Features"
2. Request "instagram_content_publish" permission
3. Provide screencast showing how your app uses this permission
4. Explain business use case
5. Submit (Review takes 2-4 weeks)

#### 6. Store Credentials
Add to `.env.local`:
```env
VITE_INSTAGRAM_APP_ID=your-app-id
INSTAGRAM_APP_SECRET=your-app-secret
```

---

### Step 1.3: TikTok API Setup

#### 1. Register TikTok Developer Account
1. Go to [TikTok Developers](https://developers.tiktok.com/)
2. Sign up with TikTok account
3. Complete developer registration

#### 2. Create App
1. Go to "Manage Apps"
2. Click "Create App"
3. App name: "Reframe AI"
4. App description: Your app description
5. Select "Content Posting API"
6. Click "Create"

#### 3. Configure OAuth Settings
1. In app settings, go to "Login Kit"
2. Add Redirect URLs:
   - `http://localhost:5173/auth/tiktok/callback`
   - `https://yourdomain.com/auth/tiktok/callback`
3. Save settings

#### 4. Apply for Production Access
1. Go to "Submit for Review"
2. Provide business verification documents
3. Explain use case
4. Submit (Review takes 1-2 weeks)

#### 5. Store Credentials
Add to `.env.local`:
```env
VITE_TIKTOK_CLIENT_KEY=your-client-key
TIKTOK_CLIENT_SECRET=your-client-secret
```

---

### Step 1.4: LinkedIn API Setup

#### 1. Create LinkedIn App
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Click "Create App"
3. App name: "Reframe AI"
4. LinkedIn Page: Create or select a company page (required)
5. Privacy policy URL: your URL
6. Upload app logo (required)
7. Click "Create App"

#### 2. Configure Products
1. Request access to "Share on LinkedIn" product
2. Request access to "Video API" (requires LinkedIn Partner Program)
3. Fill in application form

#### 3. Configure Auth Settings
1. Go to "Auth" tab
2. Add Redirect URLs:
   - `http://localhost:5173/auth/linkedin/callback`
   - `https://yourdomain.com/auth/linkedin/callback`
3. Save changes
4. **SAVE YOUR CLIENT ID AND CLIENT SECRET**

#### 4. Store Credentials
Add to `.env.local`:
```env
VITE_LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-client-secret
```

---

## Phase 2: Backend Implementation

### Step 2.1: Set Up Database Schema

Create a new Firestore collection for social media connections:

```typescript
// Collection: user_social_connections
interface SocialConnection {
  userId: string;
  platform: 'youtube' | 'instagram' | 'tiktok' | 'linkedin' | 'twitter';
  accessToken: string; // Encrypted
  refreshToken: string; // Encrypted
  expiresAt: number; // Timestamp
  platformUserId: string;
  platformUsername: string;
  connectedAt: number;
  lastUsed: number;
  isActive: boolean;
}
```

#### Update Firestore Rules
Add to your Firestore rules:
```javascript
match /user_social_connections/{connectionId} {
  allow read, write: if request.auth != null &&
                      request.auth.uid == resource.data.userId;
}
```

---

### Step 2.2: Install Required Dependencies

```bash
npm install googleapis @react-oauth/google axios crypto-js
```

For additional platforms:
```bash
npm install facebook-nodejs-business-sdk linkedin-api-client
```

---

### Step 2.3: Create Backend API Routes

Since you're using Firebase, you'll need to set up Cloud Functions:

```bash
cd functions
npm install googleapis axios crypto-js
```

#### Create `functions/src/socialMedia.ts`:

```typescript
import * as functions from 'firebase-functions';
import { google } from 'googleapis';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto-js';
import axios from 'axios';

const db = admin.firestore();

// Encryption key - store in Firebase config
const ENCRYPTION_KEY = functions.config().encryption.key || 'your-secret-key';

// Encrypt token
function encryptToken(token: string): string {
  return crypto.AES.encrypt(token, ENCRYPTION_KEY).toString();
}

// Decrypt token
function decryptToken(encryptedToken: string): string {
  const bytes = crypto.AES.decrypt(encryptedToken, ENCRYPTION_KEY);
  return bytes.toString(crypto.enc.Utf8);
}

// YouTube OAuth callback
export const youtubeCallback = functions.https.onRequest(async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send('Missing code or state');
  }

  try {
    // Exchange code for tokens
    const oauth2Client = new google.auth.OAuth2(
      functions.config().youtube.client_id,
      functions.config().youtube.client_secret,
      `${req.protocol}://${req.get('host')}/auth/youtube/callback`
    );

    const { tokens } = await oauth2Client.getToken(code as string);

    // Get user info
    oauth2Client.setCredentials(tokens);
    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    const channelResponse = await youtube.channels.list({
      part: ['snippet'],
      mine: true
    });

    const channel = channelResponse.data.items?.[0];

    if (!channel) {
      return res.status(400).send('No channel found');
    }

    // Store connection in Firestore
    const userId = state as string; // Pass userId as state
    await db.collection('user_social_connections').add({
      userId,
      platform: 'youtube',
      accessToken: encryptToken(tokens.access_token!),
      refreshToken: encryptToken(tokens.refresh_token!),
      expiresAt: tokens.expiry_date,
      platformUserId: channel.id,
      platformUsername: channel.snippet?.title,
      connectedAt: Date.now(),
      lastUsed: Date.now(),
      isActive: true
    });

    res.redirect('/?youtube=connected');
  } catch (error) {
    console.error('YouTube OAuth error:', error);
    res.status(500).send('Authentication failed');
  }
});

// Upload to YouTube
export const uploadToYoutube = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { videoUrl, title, description, tags, privacy } = data;
  const userId = context.auth.uid;

  try {
    // Get user's YouTube connection
    const connections = await db.collection('user_social_connections')
      .where('userId', '==', userId)
      .where('platform', '==', 'youtube')
      .where('isActive', '==', true)
      .get();

    if (connections.empty) {
      throw new functions.https.HttpsError('not-found', 'No YouTube connection found');
    }

    const connection = connections.docs[0].data();
    const accessToken = decryptToken(connection.accessToken);

    // Check if token expired
    if (connection.expiresAt < Date.now()) {
      // Refresh token logic here
      throw new functions.https.HttpsError('unauthenticated', 'Token expired');
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // Download video from R2
    const videoResponse = await axios.get(videoUrl, { responseType: 'stream' });

    // Upload to YouTube
    const response = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description,
          tags,
          categoryId: '22' // People & Blogs
        },
        status: {
          privacyStatus: privacy || 'public'
        }
      },
      media: {
        body: videoResponse.data
      }
    });

    // Update last used
    await connections.docs[0].ref.update({
      lastUsed: Date.now()
    });

    return {
      success: true,
      videoId: response.data.id,
      url: `https://www.youtube.com/watch?v=${response.data.id}`
    };

  } catch (error: any) {
    console.error('YouTube upload error:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Similar functions for other platforms...
// uploadToInstagram, uploadToTiktok, uploadToLinkedin
```

---

### Step 2.4: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

Set Firebase config:
```bash
firebase functions:config:set youtube.client_id="YOUR_CLIENT_ID"
firebase functions:config:set youtube.client_secret="YOUR_CLIENT_SECRET"
firebase functions:config:set encryption.key="YOUR_ENCRYPTION_KEY"
```

---

## Phase 3: Frontend Implementation

### Step 3.1: Create Social Media Connection UI

Create `src/components/SocialMediaConnections.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Connection {
  id: string;
  platform: string;
  platformUsername: string;
  connectedAt: number;
  isActive: boolean;
}

export const SocialMediaConnections: React.FC = () => {
  const { currentUser } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'user_social_connections'),
      where('userId', '==', currentUser.uid),
      where('isActive', '==', true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conns = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Connection));
      setConnections(conns);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const connectYouTube = () => {
    const clientId = import.meta.env.VITE_YOUTUBE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/youtube/callback`;
    const scope = 'https://www.googleapis.com/auth/youtube.upload';
    const state = currentUser?.uid || '';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scope)}&` +
      `access_type=offline&` +
      `state=${state}&` +
      `prompt=consent`;

    window.location.href = authUrl;
  };

  const connectInstagram = () => {
    const appId = import.meta.env.VITE_INSTAGRAM_APP_ID;
    const redirectUri = `${window.location.origin}/auth/instagram/callback`;
    const scope = 'instagram_basic,instagram_content_publish';
    const state = currentUser?.uid || '';

    const authUrl = `https://api.instagram.com/oauth/authorize?` +
      `client_id=${appId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${scope}&` +
      `response_type=code&` +
      `state=${state}`;

    window.location.href = authUrl;
  };

  const isConnected = (platform: string) => {
    return connections.some(conn => conn.platform === platform);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Connected Platforms</h2>

      <div className="space-y-4">
        {/* YouTube */}
        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-500 rounded flex items-center justify-center">
              <span className="text-white text-xl">▶</span>
            </div>
            <div>
              <h3 className="font-semibold">YouTube</h3>
              {isConnected('youtube') && (
                <p className="text-sm text-green-600">
                  Connected as {connections.find(c => c.platform === 'youtube')?.platformUsername}
                </p>
              )}
            </div>
          </div>
          {!isConnected('youtube') ? (
            <button
              onClick={connectYouTube}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Connect
            </button>
          ) : (
            <span className="text-green-600 font-semibold">✓ Connected</span>
          )}
        </div>

        {/* Instagram */}
        <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 rounded flex items-center justify-center">
              <span className="text-white text-xl">📷</span>
            </div>
            <div>
              <h3 className="font-semibold">Instagram</h3>
              {isConnected('instagram') && (
                <p className="text-sm text-green-600">
                  Connected as {connections.find(c => c.platform === 'instagram')?.platformUsername}
                </p>
              )}
            </div>
          </div>
          {!isConnected('instagram') ? (
            <button
              onClick={connectInstagram}
              className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
            >
              Connect
            </button>
          ) : (
            <span className="text-green-600 font-semibold">✓ Connected</span>
          )}
        </div>

        {/* Add TikTok, LinkedIn, Twitter similar to above */}
      </div>
    </div>
  );
};
```

---

### Step 3.2: Create Auto-Post Component

Create `src/components/AutoPostModal.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';

interface AutoPostModalProps {
  videoUrl: string;
  videoTitle: string;
  onClose: () => void;
}

export const AutoPostModal: React.FC<AutoPostModalProps> = ({
  videoUrl,
  videoTitle,
  onClose
}) => {
  const { currentUser } = useAuth();
  const [connections, setConnections] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [title, setTitle] = useState(videoTitle);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [posting, setPosting] = useState(false);
  const [results, setResults] = useState<Record<string, any>>({});

  useEffect(() => {
    loadConnections();
  }, [currentUser]);

  const loadConnections = async () => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'user_social_connections'),
      where('userId', '==', currentUser.uid),
      where('isActive', '==', true)
    );

    const snapshot = await getDocs(q);
    const platforms = snapshot.docs.map(doc => doc.data().platform);
    setConnections(platforms);
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handlePost = async () => {
    setPosting(true);
    setResults({});

    for (const platform of selectedPlatforms) {
      try {
        if (platform === 'youtube') {
          const uploadToYoutube = httpsCallable(functions, 'uploadToYoutube');
          const result = await uploadToYoutube({
            videoUrl,
            title,
            description,
            tags: tags.split(',').map(t => t.trim()),
            privacy: 'public'
          });
          setResults(prev => ({ ...prev, youtube: { success: true, data: result.data } }));
        }
        // Add other platforms here
      } catch (error: any) {
        console.error(`Error posting to ${platform}:`, error);
        setResults(prev => ({ ...prev, [platform]: { success: false, error: error.message } }));
      }
    }

    setPosting(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Post to Social Media</h2>

        {connections.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No social media accounts connected
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Go to Settings to Connect Accounts
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                maxLength={100}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                rows={4}
                maxLength={5000}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                placeholder="ai, video, editing"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select Platforms</label>
              <div className="space-y-2">
                {connections.map(platform => (
                  <label key={platform} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPlatforms.includes(platform)}
                      onChange={() => togglePlatform(platform)}
                      className="w-5 h-5"
                    />
                    <span className="capitalize">{platform}</span>
                  </label>
                ))}
              </div>
            </div>

            {Object.keys(results).length > 0 && (
              <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold mb-2">Results:</h3>
                {Object.entries(results).map(([platform, result]) => (
                  <div key={platform} className="mb-2">
                    <span className="capitalize font-medium">{platform}: </span>
                    {result.success ? (
                      <span className="text-green-600">✓ Posted successfully</span>
                    ) : (
                      <span className="text-red-600">✗ Failed: {result.error}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handlePost}
                disabled={posting || selectedPlatforms.length === 0}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {posting ? 'Posting...' : `Post to ${selectedPlatforms.length} Platform(s)`}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
```

---

### Step 3.3: Add OAuth Callback Routes

Create `src/pages/AuthCallback.tsx`:

```typescript
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const platform = window.location.pathname.split('/')[2]; // e.g., /auth/youtube/callback

    if (code && state) {
      // Send to your Cloud Function
      fetch(`YOUR_CLOUD_FUNCTION_URL/${platform}Callback?code=${code}&state=${state}`)
        .then(() => {
          navigate('/dashboard?connected=true');
        })
        .catch(error => {
          console.error('OAuth callback error:', error);
          navigate('/dashboard?error=auth_failed');
        });
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p>Connecting your account...</p>
      </div>
    </div>
  );
};
```

Update `src/App.tsx` to add routes:
```typescript
import { AuthCallback } from './pages/AuthCallback';

// In your Routes:
<Route path="/auth/youtube/callback" element={<AuthCallback />} />
<Route path="/auth/instagram/callback" element={<AuthCallback />} />
<Route path="/auth/tiktok/callback" element={<AuthCallback />} />
<Route path="/auth/linkedin/callback" element={<AuthCallback />} />
```

---

### Step 3.4: Integrate into Project Details Page

Update `src/pages/ProjectDetails.tsx` to add auto-post button:

```typescript
import { AutoPostModal } from '../components/AutoPostModal';

// In your component:
const [showAutoPost, setShowAutoPost] = useState(false);

// In your video actions:
<button
  onClick={() => setShowAutoPost(true)}
  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
>
  Post to Social Media
</button>

{showAutoPost && (
  <AutoPostModal
    videoUrl={currentVideo.url}
    videoTitle={currentVideo.title}
    onClose={() => setShowAutoPost(false)}
  />
)}
```

---

## Phase 4: Testing

### Step 4.1: Local Testing

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Test OAuth flow:**
   - Click "Connect YouTube"
   - Authorize with Google
   - Verify redirect back to your app
   - Check Firestore for saved connection

3. **Test upload:**
   - Select a processed video
   - Click "Post to Social Media"
   - Select YouTube
   - Fill in title/description
   - Click "Post"
   - Verify video appears on YouTube

### Step 4.2: Error Handling Tests

Test these scenarios:
- [ ] Token expiration (wait for token to expire)
- [ ] Network failures (disconnect internet)
- [ ] Invalid video formats
- [ ] Large file uploads
- [ ] Rate limit errors (upload many videos quickly)

---

## Phase 5: Production Deployment

### Step 5.1: Update OAuth Redirect URLs

For each platform, add production URLs:
- `https://yourdomain.com/auth/youtube/callback`
- `https://yourdomain.com/auth/instagram/callback`
- etc.

### Step 5.2: Deploy Functions

```bash
firebase deploy --only functions
```

### Step 5.3: Deploy Frontend

```bash
npm run build
firebase deploy --only hosting
```

---

## Phase 6: Monitoring & Maintenance

### Step 6.1: Set Up Monitoring

Monitor these metrics:
- OAuth connection success rate
- Upload success rate
- Token refresh failures
- API quota usage (especially YouTube)

### Step 6.2: Handle Token Refresh

Implement automatic token refresh:

```typescript
async function refreshYouTubeToken(connectionId: string) {
  const connection = await db.collection('user_social_connections').doc(connectionId).get();
  const data = connection.data();

  const oauth2Client = new google.auth.OAuth2(
    functions.config().youtube.client_id,
    functions.config().youtube.client_secret
  );

  oauth2Client.setCredentials({
    refresh_token: decryptToken(data.refreshToken)
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  await connection.ref.update({
    accessToken: encryptToken(credentials.access_token!),
    expiresAt: credentials.expiry_date
  });
}
```

---

## Summary Checklist

### Setup Phase
- [ ] Create Google Cloud project and enable YouTube API
- [ ] Create Meta app for Instagram
- [ ] Create TikTok developer account
- [ ] Create LinkedIn developer app
- [ ] Store all API credentials in `.env.local`

### Backend Phase
- [ ] Set up Firestore collection for social connections
- [ ] Install required npm packages
- [ ] Create Cloud Functions for OAuth callbacks
- [ ] Create Cloud Functions for uploads
- [ ] Deploy functions and set config

### Frontend Phase
- [ ] Create SocialMediaConnections component
- [ ] Create AutoPostModal component
- [ ] Add OAuth callback routes
- [ ] Integrate into ProjectDetails page
- [ ] Test locally

### Production Phase
- [ ] Update OAuth redirect URLs
- [ ] Deploy to production
- [ ] Test on production
- [ ] Monitor for errors

---

## Estimated Timeline

| Phase | Time Required |
|-------|---------------|
| API Setup (all platforms) | 2-3 hours |
| Backend Implementation | 4-6 hours |
| Frontend Implementation | 3-4 hours |
| Testing | 2-3 hours |
| Production Deployment | 1 hour |
| **Total** | **12-17 hours** |

**Note:** Platform approvals (Instagram, TikTok, LinkedIn) can take 1-4 weeks, but you can develop and test with YouTube immediately.

---

## Cost Breakdown

| Platform | Development Cost | Monthly Cost | Notes |
|----------|------------------|--------------|-------|
| YouTube | Free | Free | 6-7 videos/day limit |
| Instagram | Free | Free | After approval |
| TikTok | Free | Free | After approval |
| LinkedIn | Free | Free | After approval |
| Twitter/X | $100/month | $100/month | Required for posting |
| Firebase Functions | Free | ~$5-25 | Based on usage |
| **Total** | **$0** | **$5-125** | Excl. Twitter |

---

## Next Steps

1. **Start with YouTube** - Begin API setup today
2. **Apply for Instagram** - Submit app review ASAP (longest wait)
3. **Build backend** - While waiting for approvals
4. **Build frontend** - Can develop in parallel
5. **Test with YouTube** - Full end-to-end testing
6. **Add other platforms** - As approvals come through

## Support Resources

- YouTube API: https://developers.google.com/youtube/v3
- Instagram API: https://developers.facebook.com/docs/instagram-api
- TikTok API: https://developers.tiktok.com/doc
- LinkedIn API: https://learn.microsoft.com/en-us/linkedin/
- Firebase Functions: https://firebase.google.com/docs/functions

Good luck with your implementation!
