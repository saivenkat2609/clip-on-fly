import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';
import * as CryptoJS from 'crypto-js';
import axios from 'axios';
import { defineSecret } from "firebase-functions/params";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Define secrets
const youtubeClientId = defineSecret("YOUTUBE_CLIENT_ID");
const youtubeClientSecret = defineSecret("YOUTUBE_CLIENT_SECRET");
const encryptionKey = defineSecret("ENCRYPTION_KEY");

// Encryption utilities
function encryptToken(token: string, key: string): string {
  return CryptoJS.AES.encrypt(token, key).toString();
}

function decryptToken(encryptedToken: string, key: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedToken, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

// Get OAuth2 client
function getOAuth2Client(clientId: string, clientSecret: string, redirectUri?: string) {
  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );
}

/**
 * Step 1: Generate YouTube OAuth URL
 * Called from frontend when user clicks "Connect YouTube"
 */
export const getYouTubeAuthUrl = functions
  .runWith({ secrets: [youtubeClientId, youtubeClientSecret] })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }

    const userId = context.auth.uid;
    const redirectUri = data.redirectUri;
    const frontendUrl = data.frontendUrl || 'http://localhost:8080';

    // Encode both userId and frontendUrl in state parameter
    const state = JSON.stringify({ userId, frontendUrl });

    const oauth2Client = getOAuth2Client(
      youtubeClientId.value(),
      youtubeClientSecret.value(),
      redirectUri
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline', // Gets refresh token
      scope: [
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.force-ssl'
      ],
      state: state, // Pass userId and frontendUrl
      prompt: 'consent' // Force consent screen to get refresh token
    });

    return { authUrl };
  });

/**
 * Step 2: Handle OAuth Callback
 * Called when Google redirects user back to your app
 */
export const youtubeOAuthCallback = functions
  .runWith({ secrets: [youtubeClientId, youtubeClientSecret, encryptionKey] })
  .https.onRequest(async (req, res) => {
    const { code, state } = req.query;

    if (!code || !state) {
      res.status(400).send('Missing authorization code or state parameter');
      return;
    }

    // Decode state to get userId and frontendUrl
    let userId: string;
    let frontendUrl: string;
    try {
      const stateData = JSON.parse(state as string);
      userId = stateData.userId;
      frontendUrl = stateData.frontendUrl || 'http://localhost:8080';
    } catch (e) {
      // Fallback for old format (just userId)
      userId = state as string;
      frontendUrl = 'http://localhost:8080';
    }

    // IMPORTANT: Use the EXACT same redirect URI that was used when generating the auth URL
    // This must match what's registered in Google Cloud Console
    const redirectUri = `https://us-central1-reframe-1e182.cloudfunctions.net/youtubeOAuthCallback`;

    console.log('OAuth callback received:', {
      hasCode: !!code,
      userId,
      redirectUri
    });

    try {
      // Exchange authorization code for tokens
      const oauth2Client = getOAuth2Client(
        youtubeClientId.value(),
        youtubeClientSecret.value(),
        redirectUri
      );
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
        accessToken: encryptToken(tokens.access_token, encryptionKey.value()),
        refreshToken: tokens.refresh_token ? encryptToken(tokens.refresh_token, encryptionKey.value()) : null,
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

      // Redirect user back to frontend app with success message
      res.redirect(`${frontendUrl}/auth/youtube/callback?code=success&state=${userId}`);

    } catch (error: any) {
      console.error('YouTube OAuth callback error:', error);

      // Redirect to frontend with error
      res.redirect(`${frontendUrl}/auth/youtube/callback?error=${encodeURIComponent(error.message)}`);
    }
  });

/**
 * Step 3: Refresh Access Token
 * Called automatically when token expires
 */
async function refreshYouTubeToken(
  connectionDoc: FirebaseFirestore.DocumentSnapshot,
  clientId: string,
  clientSecret: string,
  encKey: string
) {
  const data = connectionDoc.data();

  if (!data || !data.refreshToken) {
    throw new Error('No refresh token available');
  }

  const oauth2Client = getOAuth2Client(clientId, clientSecret);
  oauth2Client.setCredentials({
    refresh_token: decryptToken(data.refreshToken, encKey)
  });

  const { credentials } = await oauth2Client.refreshAccessToken();

  // Update connection with new tokens
  await connectionDoc.ref.update({
    accessToken: encryptToken(credentials.access_token!, encKey),
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
    memory: '2GB',
    secrets: [youtubeClientId, youtubeClientSecret, encryptionKey]
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
      let accessToken = decryptToken(connectionData.accessToken, encryptionKey.value());

      if (connectionData.expiresAt < Date.now()) {
        console.log('Token expired, refreshing...');
        accessToken = await refreshYouTubeToken(
          connectionDoc,
          youtubeClientId.value(),
          youtubeClientSecret.value(),
          encryptionKey.value()
        );
      }

      // Set up OAuth client with access token
      const oauth2Client = getOAuth2Client(
        youtubeClientId.value(),
        youtubeClientSecret.value()
      );
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
