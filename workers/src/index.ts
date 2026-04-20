import { Env, errorResponse } from './lib/supabase';
import { handleGetYouTubeAuthUrl, handleYouTubeOAuthCallback, handleDisconnectYouTube, handleGetYouTubeConnections } from './handlers/youtube';
import { handleCreateSubscription, handleVerifyPayment, handleCancelSubscription, handleRazorpayWebhook } from './handlers/payments';
import { handleTrackVideoUsage, handleGetAllUsers, handleResetCredits } from './handlers/admin';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Route table — replaces Firebase's per-function exports
    const routes: Record<string, (req: Request, env: Env) => Promise<Response>> = {
      '/youtube/auth-url':      handleGetYouTubeAuthUrl,
      '/youtube/callback':      handleYouTubeOAuthCallback,
      '/youtube/disconnect':    handleDisconnectYouTube,
      '/youtube/connections':   handleGetYouTubeConnections,
      '/payments/create':       handleCreateSubscription,
      '/payments/verify':       handleVerifyPayment,
      '/payments/cancel':       handleCancelSubscription,
      '/payments/webhook':      handleRazorpayWebhook,
      '/usage/track':           handleTrackVideoUsage,
      '/admin/users':           handleGetAllUsers,
      '/dev/reset-credits':     handleResetCredits,
    };

    const handler = routes[path];
    if (!handler) return errorResponse('Not found', 404);

    try {
      return await handler(request, env);
    } catch (error: any) {
      console.error(`Error in ${path}:`, error);
      return errorResponse('Internal server error', 500);
    }
  },
};
