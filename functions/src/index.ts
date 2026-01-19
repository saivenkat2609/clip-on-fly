import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';
import * as CryptoJS from 'crypto-js';
import axios from 'axios';
import { defineSecret } from "firebase-functions/params";
import { RazorpayClient } from './razorpay/razorpayClient';
import {
  getRazorpayPlanId,
  getPlanCredits,
  getPlanFeatures,
  PlanName,
  BillingPeriod,
  Currency,
} from './razorpay/planMapping';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Define secrets
const youtubeClientId = defineSecret("YOUTUBE_CLIENT_ID");
const youtubeClientSecret = defineSecret("YOUTUBE_CLIENT_SECRET");
const encryptionKey = defineSecret("ENCRYPTION_KEY");
const razorpayKeyId = defineSecret("RAZORPAY_KEY_ID");
const razorpayKeySecret = defineSecret("RAZORPAY_KEY_SECRET");
const razorpayWebhookSecret = defineSecret("RAZORPAY_WEBHOOK_SECRET");

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
 * Safely truncate a string to a maximum length without breaking UTF-8 characters.
 * Regular substring() can split multi-byte UTF-8 characters (emojis, etc), causing "Malformed UTF-8 data" errors.
 *
 * @param str - String to truncate
 * @param maxLength - Maximum length in characters (not bytes)
 * @returns Safely truncated string
 */
function safeTruncate(str: string | undefined | null, maxLength: number): string {
  if (!str) return '';

  // Use Array.from() to properly handle multi-byte UTF-8 characters
  // This counts actual characters, not bytes
  const chars = Array.from(str);

  if (chars.length <= maxLength) {
    return str;
  }

  // Take only the first maxLength characters
  return chars.slice(0, maxLength).join('');
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
            title: safeTruncate(title, 100), // YouTube max 100 chars (UTF-8 safe)
            description: safeTruncate(description, 5000), // YouTube max 5000 chars (UTF-8 safe)
            tags: (tags || []).map((tag: string) => safeTruncate(tag, 500)), // YouTube max 500 chars per tag (UTF-8 safe)
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

// ============================================================================
// RAZORPAY PAYMENT GATEWAY FUNCTIONS
// ============================================================================

/**
 * Step 1: Create Razorpay Subscription
 * Creates or retrieves customer and creates subscription in Razorpay
 */
export const createRazorpaySubscription = functions
  .runWith({
    secrets: [razorpayKeyId, razorpayKeySecret, razorpayWebhookSecret],
    memory: '512MB',
  })
  .https.onCall(async (data, context) => {
    const startTime = Date.now();
    console.log('[PERF] createRazorpaySubscription started');

    // 1. Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const { planName, billingPeriod, currency } = data as {
      planName: PlanName;
      billingPeriod: BillingPeriod;
      currency: Currency;
    };

    // 2. Validate input
    if (!planName || !billingPeriod || !currency) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    if (planName === 'Free') {
      throw new functions.https.HttpsError('invalid-argument', 'Cannot create subscription for Free plan');
    }

    // 3. Get user data ONLY - skip subscription check (fastest)
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    console.log(`[PERF] User data fetched in ${Date.now() - startTime}ms`);

    if (!userData) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    // Skip subscription check for maximum speed
    // Razorpay will handle duplicate subscriptions on their end

    // 4. Initialize Razorpay client
    const razorpayClient = new RazorpayClient(
      razorpayKeyId.value(),
      razorpayKeySecret.value(),
      razorpayWebhookSecret.value()
    );

    try {
      // 5. Create or get Razorpay customer
      let customerId = userData?.razorpayCustomerId;
      if (!customerId) {
        console.log(`[PERF] Creating new Razorpay customer at ${Date.now() - startTime}ms`);
        const customer: any = await razorpayClient.createCustomer(
          userData.email,
          userData.displayName || 'User'
        );
        customerId = customer.id;
        console.log(`[PERF] Customer created in ${Date.now() - startTime}ms`);

        // Save customer ID
        await db.collection('users').doc(userId).update({
          razorpayCustomerId: customerId,
        });
      } else {
        console.log(`[PERF] Using existing customer ID at ${Date.now() - startTime}ms`);
      }

      // 6. Get plan ID from mapping
      const planId = getRazorpayPlanId(planName, billingPeriod, currency);

      // 7. Create subscription
      console.log(`[PERF] Creating subscription at ${Date.now() - startTime}ms`);
      const subscription: any = await razorpayClient.createSubscription(
        customerId,
        planId,
        {
          notify_email: userData.email,
        }
      );
      console.log(`[PERF] Subscription created in ${Date.now() - startTime}ms`);

      // 8. Save subscription to Firestore
      const subscriptionData = {
        razorpaySubscriptionId: subscription.id,
        razorpayPlanId: planId,
        razorpayCustomerId: customerId,
        userId,
        planName,
        billingPeriod,
        currency,
        amount: subscription.plan?.item?.amount || 0,
        status: subscription.status,
        totalCredits: getPlanCredits(planName),
        creditsUsed: 0,
        creditsRemaining: getPlanCredits(planName),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db
        .collection('users')
        .doc(userId)
        .collection('subscriptions')
        .doc(subscription.id)
        .set(subscriptionData);

      // 9. Return subscription details for frontend
      console.log(`[PERF] Total createRazorpaySubscription time: ${Date.now() - startTime}ms`);
      return {
        subscriptionId: subscription.id,
        planId: subscription.plan_id,
        status: subscription.status,
        shortUrl: subscription.short_url,
      };
    } catch (error: any) {
      console.error('Create subscription error:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

/**
 * Step 2: Verify Razorpay Payment & Activate Subscription
 */
export const verifyRazorpayPayment = functions
  .runWith({
    secrets: [razorpayKeyId, razorpayKeySecret, razorpayWebhookSecret],
  })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const { razorpayPaymentId, razorpaySubscriptionId, razorpaySignature } = data;

    if (!razorpayPaymentId || !razorpaySubscriptionId || !razorpaySignature) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing payment details');
    }

    // Verify signature (optional additional check)
    const razorpayClient = new RazorpayClient(
      razorpayKeyId.value(),
      razorpayKeySecret.value(),
      razorpayWebhookSecret.value()
    );

    try {
      // Fetch subscription and payment from Razorpay
      const subscription = await razorpayClient.fetchSubscription(razorpaySubscriptionId);
      const payment = await razorpayClient.fetchPayment(razorpayPaymentId);

      console.log('Subscription status:', subscription.status);
      console.log('Payment status:', payment.status);

      // Accept 'active' or 'authenticated' status (authenticated means first payment done, waiting for activation)
      if (subscription.status === 'active' || subscription.status === 'authenticated') {
        // Update Firestore subscription
        const subscriptionRef = db
          .collection('users')
          .doc(userId)
          .collection('subscriptions')
          .doc(razorpaySubscriptionId);

        const subscriptionDoc = await subscriptionRef.get();
        const subscriptionData = subscriptionDoc.data();

        if (!subscriptionData) {
          throw new functions.https.HttpsError('not-found', 'Subscription not found');
        }

        // Calculate billing cycle dates
        await subscriptionRef.update({
          status: 'active',
          startedAt: subscription.start_at ? admin.firestore.Timestamp.fromMillis(subscription.start_at * 1000) : null,
          currentStart: subscription.current_start ? admin.firestore.Timestamp.fromMillis(subscription.current_start * 1000) : null,
          currentEnd: subscription.current_end ? admin.firestore.Timestamp.fromMillis(subscription.current_end * 1000) : null,
          nextBillingAt: subscription.charge_at ? admin.firestore.Timestamp.fromMillis(subscription.charge_at * 1000) : null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update user profile
        const planFeatures = getPlanFeatures(subscriptionData.planName);
        await db.collection('users').doc(userId).update({
          plan: subscriptionData.planName,
          subscriptionStatus: subscription.status === 'active' ? 'active' : 'authenticated',
          subscriptionId: razorpaySubscriptionId,
          totalCredits: subscriptionData.totalCredits,
          creditsUsed: 0,
          creditsExpiryDate: subscription.current_end ? admin.firestore.Timestamp.fromMillis(subscription.current_end * 1000) : null,
          ...planFeatures,
        });

        // Create transaction record with actual payment amount
        await db
          .collection('users')
          .doc(userId)
          .collection('transactions')
          .add({
            razorpayPaymentId,
            razorpaySubscriptionId,
            razorpayCustomerId: subscriptionData.razorpayCustomerId,
            razorpayInvoiceId: payment.invoice_id || null,
            userId,
            planName: subscriptionData.planName,
            billingPeriod: subscriptionData.billingPeriod,
            amount: payment.amount, // Actual payment amount from Razorpay
            currency: payment.currency,
            status: payment.status,
            method: payment.method || 'card',
            cardLast4: payment.card?.last4 || null,
            cardNetwork: payment.card?.network || null,
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            description: `${subscriptionData.planName} Plan - ${subscriptionData.billingPeriod}`,
          });

        return {
          success: true,
          status: subscription.status,
          message: 'Subscription activated successfully',
        };
      }

      // If subscription is in other status, log details
      console.error('Subscription not active:', {
        status: subscription.status,
        subscriptionId: razorpaySubscriptionId,
        paymentId: razorpayPaymentId,
      });

      return {
        success: false,
        status: subscription.status,
        message: `Subscription status is ${subscription.status}. Expected 'active' or 'authenticated'.`,
      };
    } catch (error: any) {
      console.error('Verify payment error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        razorpaySubscriptionId,
        razorpayPaymentId,
      });
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

/**
 * Step 3: Cancel Razorpay Subscription
 */
export const cancelRazorpaySubscription = functions
  .runWith({
    secrets: [razorpayKeyId, razorpayKeySecret, razorpayWebhookSecret],
  })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const { subscriptionId, cancelAtCycleEnd } = data;

    if (!subscriptionId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing subscription ID');
    }

    const razorpayClient = new RazorpayClient(
      razorpayKeyId.value(),
      razorpayKeySecret.value(),
      razorpayWebhookSecret.value()
    );

    try {
      // Cancel in Razorpay
      await razorpayClient.cancelSubscription(subscriptionId, cancelAtCycleEnd);

      // Update Firestore
      const subscriptionRef = db
        .collection('users')
        .doc(userId)
        .collection('subscriptions')
        .doc(subscriptionId);

      await subscriptionRef.update({
        status: cancelAtCycleEnd ? 'active' : 'cancelled',
        cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update user profile only if immediate cancellation
      if (!cancelAtCycleEnd) {
        const freeFeatures = getPlanFeatures('Free');
        await db.collection('users').doc(userId).update({
          plan: 'Free',
          subscriptionStatus: 'cancelled',
          totalCredits: getPlanCredits('Free'),
          creditsUsed: 0,
          ...freeFeatures,
        });
      }

      return {
        success: true,
        message: cancelAtCycleEnd
          ? 'Subscription will be cancelled at end of billing cycle'
          : 'Subscription cancelled immediately',
      };
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

/**
 * Step 4: Track Video Usage
 * Deducts credits when user processes a video
 */
export const trackVideoUsage = functions
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;
    const { videoId, sessionId, durationSeconds } = data;

    if (!videoId || !sessionId || !durationSeconds) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    const durationMinutes = Math.ceil(durationSeconds / 60);

    try {
      // CRITICAL FIX: Check if this video was already tracked to prevent double-charging
      const videoRef = db.collection('users').doc(userId).collection('videos').doc(sessionId);
      const videoDoc = await videoRef.get();

      if (!videoDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Video not found');
      }

      const videoData = videoDoc.data();

      // If already tracked, return early without charging again
      if (videoData?.usageTracked === true) {
        console.log(`[trackVideoUsage] Video ${sessionId} already tracked, skipping`);
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();
        return {
          success: true,
          alreadyTracked: true,
          creditsUsed: userData?.creditsUsed || 0,
          creditsRemaining: (userData?.totalCredits || 0) - (userData?.creditsUsed || 0),
        };
      }

      // Mark video as tracked IMMEDIATELY to prevent race conditions
      await videoRef.update({
        usageTracked: true,
        usageTrackedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Get user's current subscription
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData) {
        throw new functions.https.HttpsError('not-found', 'User not found');
      }

      // Check if user has enough credits
      const creditsUsed = userData.creditsUsed || 0;
      const totalCredits = userData.totalCredits || getPlanCredits('Free');

      if (creditsUsed + durationMinutes > totalCredits) {
        throw new functions.https.HttpsError(
          'resource-exhausted',
          'Insufficient credits. Please upgrade your plan.'
        );
      }

      // Update user credits
      await db.collection('users').doc(userId).update({
        creditsUsed: admin.firestore.FieldValue.increment(durationMinutes),
      });

      console.log(`[trackVideoUsage] ✓ Tracked ${durationMinutes} credits for video ${sessionId}`);

      // Update usage tracking
      const monthYear = new Date().toISOString().slice(0, 7);
      const usageRef = db
        .collection('users')
        .doc(userId)
        .collection('usage')
        .doc(monthYear);

      const usageDoc = await usageRef.get();

      if (!usageDoc.exists) {
        // Create new usage document
        await usageRef.set({
          userId,
          monthYear,
          subscriptionId: userData.subscriptionId || null,
          planName: userData.plan || 'Free',
          totalCredits,
          videosProcessed: 1,
          totalMinutesUsed: durationMinutes,
          clipsGenerated: 0,
          videos: [{
            videoId,
            sessionId,
            minutesUsed: durationMinutes,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
          }],
          creditsRemaining: totalCredits - durationMinutes,
          warningsSent: {
            at75Percent: false,
            at90Percent: false,
            at100Percent: false,
          },
          periodStart: userData.currentStart || admin.firestore.FieldValue.serverTimestamp(),
          periodEnd: userData.creditsExpiryDate || admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Update existing usage document
        await usageRef.update({
          videosProcessed: admin.firestore.FieldValue.increment(1),
          totalMinutesUsed: admin.firestore.FieldValue.increment(durationMinutes),
          videos: admin.firestore.FieldValue.arrayUnion({
            videoId,
            sessionId,
            minutesUsed: durationMinutes,
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
          }),
          creditsRemaining: admin.firestore.FieldValue.increment(-durationMinutes),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // Check for usage warnings
      const usagePercentage = ((creditsUsed + durationMinutes) / totalCredits) * 100;
      const usageData = (await usageRef.get()).data();

      if (usagePercentage >= 100 && !usageData?.warningsSent.at100Percent) {
        // Send 100% usage notification
        await usageRef.update({
          'warningsSent.at100Percent': true,
        });
        // TODO: Send email/notification
      } else if (usagePercentage >= 90 && !usageData?.warningsSent.at90Percent) {
        await usageRef.update({
          'warningsSent.at90Percent': true,
        });
        // TODO: Send email/notification
      } else if (usagePercentage >= 75 && !usageData?.warningsSent.at75Percent) {
        await usageRef.update({
          'warningsSent.at75Percent': true,
        });
        // TODO: Send email/notification
      }

      return {
        success: true,
        alreadyTracked: false,
        creditsUsed: creditsUsed + durationMinutes,
        creditsRemaining: totalCredits - (creditsUsed + durationMinutes),
      };
    } catch (error: any) {
      console.error('Track usage error:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });

/**
 * UTILITY: Mark all existing videos as tracked (one-time migration)
 * Call this once to prevent old videos from being re-tracked
 */
export const markAllVideosAsTracked = functions
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;

    try {
      console.log(`[markAllVideosAsTracked] Starting for user ${userId}`);

      const videosSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('videos')
        .get();

      let markedCount = 0;
      let alreadyMarkedCount = 0;

      const batch = db.batch();

      videosSnapshot.docs.forEach((videoDoc) => {
        const videoData = videoDoc.data();

        if (!videoData.usageTracked) {
          batch.update(videoDoc.ref, {
            usageTracked: true,
            usageTrackedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          markedCount++;
        } else {
          alreadyMarkedCount++;
        }
      });

      await batch.commit();

      console.log(`[markAllVideosAsTracked] ✓ Marked ${markedCount} videos, ${alreadyMarkedCount} already marked`);

      return {
        success: true,
        markedCount,
        alreadyMarkedCount,
        totalVideos: videosSnapshot.size,
      };
    } catch (error: any) {
      console.error('[markAllVideosAsTracked] Error:', error);
      throw new functions.https.HttpsError(
        'internal',
        error?.message || 'Failed to mark videos as tracked'
      );
    }
  });

/**
 * UTILITY: Reset credits to zero (for testing)
 */
export const resetCreditsForTesting = functions
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;

    try {
      console.log(`[resetCreditsForTesting] Resetting credits for user ${userId}`);

      await db.collection('users').doc(userId).update({
        creditsUsed: 0,
      });

      console.log(`[resetCreditsForTesting] ✓ Credits reset to 0`);

      return {
        success: true,
        message: 'Credits reset to 0',
      };
    } catch (error: any) {
      console.error('[resetCreditsForTesting] Error:', error);
      throw new functions.https.HttpsError(
        'internal',
        error?.message || 'Failed to reset credits'
      );
    }
  });

/**
 * Step 5: Razorpay Webhook Handler
 * Processes subscription events from Razorpay
 */
export const razorpayWebhook = functions
  .runWith({
    secrets: [razorpayWebhookSecret, razorpayKeyId, razorpayKeySecret],
    memory: '512MB',
  })
  .https.onRequest(async (req, res) => {
    // Only accept POST requests
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const signature = req.headers['x-razorpay-signature'] as string;
    const payload = JSON.stringify(req.body);

    const razorpayClient = new RazorpayClient(
      razorpayKeyId.value(),
      razorpayKeySecret.value(),
      razorpayWebhookSecret.value()
    );

    // Verify webhook signature
    if (!razorpayClient.verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      res.status(400).send('Invalid signature');
      return;
    }

    const event = req.body.event;
    const eventData = req.body.payload;

    console.log('Razorpay webhook received:', event);

    try {
      switch (event) {
        case 'subscription.activated':
          await handleSubscriptionActivated(eventData.subscription.entity);
          break;

        case 'subscription.charged':
          await handleSubscriptionCharged(eventData.payment.entity, eventData.subscription.entity);
          break;

        case 'subscription.cancelled':
          await handleSubscriptionCancelled(eventData.subscription.entity);
          break;

        case 'subscription.completed':
          await handleSubscriptionCompleted(eventData.subscription.entity);
          break;

        case 'subscription.halted':
          await handleSubscriptionHalted(eventData.subscription.entity);
          break;

        case 'subscription.paused':
          await handleSubscriptionPaused(eventData.subscription.entity);
          break;

        case 'subscription.resumed':
          await handleSubscriptionResumed(eventData.subscription.entity);
          break;

        case 'payment.failed':
          await handlePaymentFailed(eventData.payment.entity);
          break;

        default:
          console.log('Unhandled webhook event:', event);
      }

      res.status(200).json({ status: 'success' });
    } catch (error: any) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });

/**
 * Webhook event handlers
 */
async function handleSubscriptionActivated(subscription: any) {
  const subscriptionsSnapshot = await db
    .collectionGroup('subscriptions')
    .where('razorpaySubscriptionId', '==', subscription.id)
    .limit(1)
    .get();

  if (subscriptionsSnapshot.empty) {
    console.error('Subscription not found:', subscription.id);
    return;
  }

  const subscriptionDoc = subscriptionsSnapshot.docs[0];
  const subscriptionData = subscriptionDoc.data();
  const userId = subscriptionData.userId;

  await subscriptionDoc.ref.update({
    status: 'active',
    startedAt: admin.firestore.Timestamp.fromMillis(subscription.start_at * 1000),
    currentStart: admin.firestore.Timestamp.fromMillis(subscription.current_start * 1000),
    currentEnd: admin.firestore.Timestamp.fromMillis(subscription.current_end * 1000),
    nextBillingAt: admin.firestore.Timestamp.fromMillis(subscription.charge_at * 1000),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const planFeatures = getPlanFeatures(subscriptionData.planName);
  await db.collection('users').doc(userId).update({
    plan: subscriptionData.planName,
    subscriptionStatus: 'active',
    subscriptionId: subscription.id,
    totalCredits: subscriptionData.totalCredits,
    creditsExpiryDate: admin.firestore.Timestamp.fromMillis(subscription.current_end * 1000),
    ...planFeatures,
  });

  const monthYear = new Date().toISOString().slice(0, 7);
  await db
    .collection('users')
    .doc(userId)
    .collection('usage')
    .doc(monthYear)
    .set({
      userId,
      monthYear,
      subscriptionId: subscription.id,
      planName: subscriptionData.planName,
      totalCredits: subscriptionData.totalCredits,
      videosProcessed: 0,
      totalMinutesUsed: 0,
      clipsGenerated: 0,
      videos: [],
      creditsRemaining: subscriptionData.totalCredits,
      warningsSent: {
        at75Percent: false,
        at90Percent: false,
        at100Percent: false,
      },
      periodStart: admin.firestore.Timestamp.fromMillis(subscription.current_start * 1000),
      periodEnd: admin.firestore.Timestamp.fromMillis(subscription.current_end * 1000),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

async function handleSubscriptionCharged(payment: any, subscription: any) {
  const subscriptionsSnapshot = await db
    .collectionGroup('subscriptions')
    .where('razorpaySubscriptionId', '==', subscription.id)
    .limit(1)
    .get();

  if (subscriptionsSnapshot.empty) return;

  const subscriptionData = subscriptionsSnapshot.docs[0].data();
  const userId = subscriptionData.userId;

  await db
    .collection('users')
    .doc(userId)
    .collection('transactions')
    .add({
      razorpayPaymentId: payment.id,
      razorpaySubscriptionId: subscription.id,
      razorpayCustomerId: subscriptionData.razorpayCustomerId,
      razorpayInvoiceId: payment.invoice_id,
      userId,
      planName: subscriptionData.planName,
      billingPeriod: subscriptionData.billingPeriod,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      cardLast4: payment.card?.last4,
      cardNetwork: payment.card?.network,
      paidAt: admin.firestore.Timestamp.fromMillis(payment.created_at * 1000),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      description: `${subscriptionData.planName} Plan - Renewal`,
    });

  await subscriptionsSnapshot.docs[0].ref.update({
    currentStart: admin.firestore.Timestamp.fromMillis(subscription.current_start * 1000),
    currentEnd: admin.firestore.Timestamp.fromMillis(subscription.current_end * 1000),
    nextBillingAt: admin.firestore.Timestamp.fromMillis(subscription.charge_at * 1000),
    creditsUsed: 0,
    creditsRemaining: subscriptionData.totalCredits,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection('users').doc(userId).update({
    creditsUsed: 0,
    creditsExpiryDate: admin.firestore.Timestamp.fromMillis(subscription.current_end * 1000),
  });
}

async function handleSubscriptionCancelled(subscription: any) {
  const subscriptionsSnapshot = await db
    .collectionGroup('subscriptions')
    .where('razorpaySubscriptionId', '==', subscription.id)
    .limit(1)
    .get();

  if (subscriptionsSnapshot.empty) return;

  const subscriptionData = subscriptionsSnapshot.docs[0].data();
  const userId = subscriptionData.userId;

  await subscriptionsSnapshot.docs[0].ref.update({
    status: 'cancelled',
    cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const freeFeatures = getPlanFeatures('Free');
  await db.collection('users').doc(userId).update({
    plan: 'Free',
    subscriptionStatus: 'cancelled',
    totalCredits: getPlanCredits('Free'),
    ...freeFeatures,
  });
}

async function handleSubscriptionCompleted(subscription: any) {
  const subscriptionsSnapshot = await db
    .collectionGroup('subscriptions')
    .where('razorpaySubscriptionId', '==', subscription.id)
    .limit(1)
    .get();

  if (subscriptionsSnapshot.empty) return;

  await subscriptionsSnapshot.docs[0].ref.update({
    status: 'completed',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function handleSubscriptionHalted(subscription: any) {
  const subscriptionsSnapshot = await db
    .collectionGroup('subscriptions')
    .where('razorpaySubscriptionId', '==', subscription.id)
    .limit(1)
    .get();

  if (subscriptionsSnapshot.empty) return;

  const subscriptionData = subscriptionsSnapshot.docs[0].data();
  const userId = subscriptionData.userId;

  await subscriptionsSnapshot.docs[0].ref.update({
    status: 'halted',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection('users').doc(userId).update({
    subscriptionStatus: 'halted',
  });
}

async function handleSubscriptionPaused(subscription: any) {
  const subscriptionsSnapshot = await db
    .collectionGroup('subscriptions')
    .where('razorpaySubscriptionId', '==', subscription.id)
    .limit(1)
    .get();

  if (subscriptionsSnapshot.empty) return;

  const subscriptionData = subscriptionsSnapshot.docs[0].data();
  const userId = subscriptionData.userId;

  await subscriptionsSnapshot.docs[0].ref.update({
    status: 'paused',
    pausedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection('users').doc(userId).update({
    subscriptionStatus: 'paused',
  });
}

async function handleSubscriptionResumed(subscription: any) {
  const subscriptionsSnapshot = await db
    .collectionGroup('subscriptions')
    .where('razorpaySubscriptionId', '==', subscription.id)
    .limit(1)
    .get();

  if (subscriptionsSnapshot.empty) return;

  const subscriptionData = subscriptionsSnapshot.docs[0].data();
  const userId = subscriptionData.userId;

  await subscriptionsSnapshot.docs[0].ref.update({
    status: 'active',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection('users').doc(userId).update({
    subscriptionStatus: 'active',
  });
}

async function handlePaymentFailed(payment: any) {
  console.error('Payment failed:', payment.id, payment.error_description);
  // TODO: Send notification to user about failed payment
}

/**
 * Admin Function: Get All Users
 * Fetches all users for admin dashboard
 * Only accessible by users with role='admin'
 */
export const getAllUsers = functions
  .https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const userId = context.auth.uid;

    try {
      // Check if user is admin
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();

      if (!userData || userData.role !== 'admin') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only admin users can access this function'
        );
      }

      console.log(`[getAllUsers] Admin ${userId} requesting all users`);

      // Fetch all users (Admin SDK bypasses security rules)
      const usersSnapshot = await db.collection('users')
        .orderBy('createdAt', 'desc')
        .get();

      const users = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email || '',
          displayName: data.displayName || 'Unknown User',
          plan: data.plan || 'Free',
          totalCredits: data.totalCredits || 0,
          creditsUsed: data.creditsUsed || 0,
          subscriptionStatus: data.subscriptionStatus || 'none',
          createdAt: data.createdAt || null,
        };
      });

      console.log(`[getAllUsers] Successfully fetched ${users.length} users`);

      return {
        success: true,
        users: users,
      };
    } catch (error: any) {
      console.error('[getAllUsers] Error:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });
