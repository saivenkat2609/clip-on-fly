import { Env, getSupabaseAdmin, verifyAuth, errorResponse, jsonResponse } from '../lib/supabase';
import { getPlanCredits } from '../lib/planMapping';

// Replaces: trackVideoUsage Cloud Function
export async function handleTrackVideoUsage(request: Request, env: Env): Promise<Response> {
  const userId = await verifyAuth(request, env);
  if (!userId) return errorResponse('Unauthenticated', 401);

  const { videoId, sessionId, durationSeconds } = await request.json() as any;
  if (!videoId || !sessionId || !durationSeconds) return errorResponse('Missing required fields', 400);

  const durationMinutes = Math.ceil(durationSeconds / 60);
  const supabase = getSupabaseAdmin(env);

  // Check if already tracked to prevent double-charging
  const { data: video } = await supabase
    .from('videos').select('usage_tracked').eq('session_id', sessionId).single();

  if (!video) return errorResponse('Video not found', 404);

  if (video.usage_tracked) {
    const { data: user } = await supabase.from('users').select('credits_used, total_credits').eq('id', userId).single();
    return jsonResponse({
      success: true, alreadyTracked: true,
      creditsUsed: user?.credits_used || 0,
      creditsRemaining: (user?.total_credits || 0) - (user?.credits_used || 0),
    });
  }

  // Mark as tracked immediately to prevent race conditions
  await supabase.from('videos').update({
    usage_tracked: true,
    usage_tracked_at: new Date().toISOString(),
  }).eq('session_id', sessionId);

  const { data: userData } = await supabase
    .from('users').select('credits_used, total_credits, plan, subscription_id').eq('id', userId).single();

  if (!userData) return errorResponse('User not found', 404);

  const creditsUsed = userData.credits_used || 0;
  const totalCredits = userData.total_credits || getPlanCredits('Free');

  if (creditsUsed + durationMinutes > totalCredits) {
    return errorResponse('Insufficient credits. Please upgrade your plan.', 429);
  }

  // Atomic increment — replaces FieldValue.increment()
  await supabase.rpc('increment_credits_used', { p_user_id: userId, p_amount: durationMinutes });

  return jsonResponse({
    success: true, alreadyTracked: false,
    creditsUsed: creditsUsed + durationMinutes,
    creditsRemaining: totalCredits - (creditsUsed + durationMinutes),
  });
}

// Replaces: getAllUsers Cloud Function
export async function handleGetAllUsers(request: Request, env: Env): Promise<Response> {
  const userId = await verifyAuth(request, env);
  if (!userId) return errorResponse('Unauthenticated', 401);

  const supabase = getSupabaseAdmin(env);

  // Check admin role
  const { data: user } = await supabase.from('users').select('role').eq('id', userId).single();
  if (!user || user.role !== 'admin') return errorResponse('Permission denied', 403);

  const { data: users } = await supabase
    .from('users')
    .select('id, email, display_name, plan, total_credits, credits_used, subscription_status, created_at')
    .order('created_at', { ascending: false });

  return jsonResponse({
    success: true,
    users: (users ?? []).map(u => ({
      uid: u.id,
      email: u.email,
      displayName: u.display_name || 'Unknown User',
      plan: u.plan || 'Free',
      totalCredits: u.total_credits || 0,
      creditsUsed: u.credits_used || 0,
      subscriptionStatus: u.subscription_status || 'none',
      createdAt: u.created_at,
    })),
  });
}

// Replaces: resetCreditsForTesting Cloud Function
export async function handleResetCredits(request: Request, env: Env): Promise<Response> {
  const userId = await verifyAuth(request, env);
  if (!userId) return errorResponse('Unauthenticated', 401);

  const supabase = getSupabaseAdmin(env);
  await supabase.from('users').update({ credits_used: 0 }).eq('id', userId);
  return jsonResponse({ success: true });
}
