import { Env, getSupabaseAdmin, verifyAuth, errorResponse, jsonResponse } from '../lib/supabase';
import { encryptToken, decryptToken } from '../lib/crypto';

const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.force-ssl',
].join(' ');

// Replaces: getYouTubeAuthUrl Cloud Function
export async function handleGetYouTubeAuthUrl(request: Request, env: Env): Promise<Response> {
  const userId = await verifyAuth(request, env);
  if (!userId) return errorResponse('Unauthenticated', 401);

  const { redirectUri, frontendUrl } = await request.json() as any;
  const state = JSON.stringify({ userId, frontendUrl: frontendUrl || 'http://localhost:8080' });

  // Build Google OAuth URL manually — replaces googleapis oauth2Client.generateAuthUrl()
  const params = new URLSearchParams({
    client_id: env.YOUTUBE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: YOUTUBE_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return jsonResponse({ authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
}

// Replaces: youtubeOAuthCallback Cloud Function (HTTP redirect handler)
export async function handleYouTubeOAuthCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const googleError = url.searchParams.get('error');

  // Google returned an error (e.g. access_denied) — redirect user back to frontend
  if (googleError || !code || !state) {
    let frontendUrl = 'http://localhost:8080';
    try {
      if (state) frontendUrl = JSON.parse(state).frontendUrl || frontendUrl;
    } catch {}
    const msg = googleError === 'access_denied' ? 'Authorization denied' : (googleError || 'Missing code or state');
    return Response.redirect(`${frontendUrl}/auth/youtube/callback?error=${encodeURIComponent(msg)}`, 302);
  }

  let userId: string;
  let frontendUrl: string;
  try {
    const stateData = JSON.parse(state);
    userId = stateData.userId;
    frontendUrl = stateData.frontendUrl || 'http://localhost:8080';
  } catch {
    return errorResponse('Invalid state', 400);
  }

  const redirectUri = `${new URL(request.url).origin}/youtube/callback`;

  try {
    // Exchange code for tokens — replaces oauth2Client.getToken()
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: env.YOUTUBE_CLIENT_ID,
        client_secret: env.YOUTUBE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json() as any;
    if (!tokens.access_token) throw new Error('No access token received');

    // Get YouTube channel info
    const channelRes = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&mine=true',
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    const channelData = await channelRes.json() as any;
    const channel = channelData.items?.[0];
    if (!channel) throw new Error('No YouTube channel found');

    const supabase = getSupabaseAdmin(env);

    // Upsert connection — replaces Firestore add/update
    await supabase.from('user_social_connections').upsert({
      user_id: userId,
      platform: 'youtube',
      access_token: await encryptToken(tokens.access_token, env.ENCRYPTION_KEY),
      refresh_token: tokens.refresh_token ? await encryptToken(tokens.refresh_token, env.ENCRYPTION_KEY) : null,
      expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
      channel_id: channel.id,
      channel_name: channel.snippet?.title || 'Unknown',
      connected_at: new Date().toISOString(),
      is_active: true,
    }, { onConflict: 'user_id,platform' });

    return Response.redirect(`${frontendUrl}/auth/youtube/callback?code=success&state=${userId}`, 302);
  } catch (error: any) {
    return Response.redirect(`${frontendUrl}/auth/youtube/callback?error=${encodeURIComponent(error.message)}`, 302);
  }
}

// Replaces: disconnectYouTube Cloud Function
export async function handleDisconnectYouTube(request: Request, env: Env): Promise<Response> {
  const userId = await verifyAuth(request, env);
  if (!userId) return errorResponse('Unauthenticated', 401);

  const supabase = getSupabaseAdmin(env);
  const { error } = await supabase
    .from('user_social_connections')
    .delete()
    .eq('user_id', userId)
    .eq('platform', 'youtube');

  if (error) return errorResponse(error.message, 500);
  return jsonResponse({ success: true });
}

// Replaces: getYouTubeConnections Cloud Function
export async function handleGetYouTubeConnections(request: Request, env: Env): Promise<Response> {
  const userId = await verifyAuth(request, env);
  if (!userId) return errorResponse('Unauthenticated', 401);

  const supabase = getSupabaseAdmin(env);
  const { data: rows } = await supabase
    .from('user_social_connections')
    .select('id, channel_name, connected_at')
    .eq('user_id', userId)
    .eq('platform', 'youtube')
    .eq('is_active', true);

  return jsonResponse({
    connections: (rows ?? []).map(r => ({
      id: r.id,
      platformUsername: r.channel_name,
      platformThumbnail: null,
      connectedAt: new Date(r.connected_at).getTime(),
    }))
  });
}
