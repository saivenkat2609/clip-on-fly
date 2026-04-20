import { Env, getSupabaseAdmin, verifyAuth, errorResponse, jsonResponse } from '../lib/supabase';
import { RazorpayClient } from '../lib/razorpay';
import { getRazorpayPlanId, getPlanCredits, getPlanFeatures } from '../lib/planMapping';
import type { PlanName, BillingPeriod, Currency } from '../lib/planMapping';

function getRazorpay(env: Env) {
  return new RazorpayClient(env.RAZORPAY_KEY_ID, env.RAZORPAY_KEY_SECRET, env.RAZORPAY_WEBHOOK_SECRET);
}

// Replaces: createRazorpaySubscription Cloud Function
export async function handleCreateSubscription(request: Request, env: Env): Promise<Response> {
  const userId = await verifyAuth(request, env);
  if (!userId) return errorResponse('Unauthenticated', 401);

  const { planName, billingPeriod, currency } = await request.json() as {
    planName: PlanName; billingPeriod: BillingPeriod; currency: Currency;
  };

  if (!planName || !billingPeriod || !currency) return errorResponse('Missing required fields', 400);
  if (planName === 'Free') return errorResponse('Cannot create subscription for Free plan', 400);

  const supabase = getSupabaseAdmin(env);
  const { data: userData } = await supabase.from('users').select('*').eq('id', userId).single();
  if (!userData) return errorResponse('User not found', 404);

  const razorpay = getRazorpay(env);

  try {
    let customerId = userData.razorpay_customer_id;
    if (!customerId) {
      const customer = await razorpay.createCustomer(userData.email, userData.display_name || 'User');
      customerId = customer.id;
      await supabase.from('users').update({ razorpay_customer_id: customerId }).eq('id', userId);
    }

    const planId = getRazorpayPlanId(planName, billingPeriod, currency);
    const subscription = await razorpay.createSubscription(customerId, planId, userData.email);

    // Save subscription to Supabase — replaces Firestore subcollection set
    await supabase.from('subscriptions').insert({
      id: subscription.id,
      user_id: userId,
      razorpay_subscription_id: subscription.id,
      razorpay_plan_id: planId,
      razorpay_customer_id: customerId,
      plan_name: planName,
      billing_period: billingPeriod,
      currency,
      amount: subscription.plan?.item?.amount || 0,
      status: subscription.status,
    });

    return jsonResponse({ subscriptionId: subscription.id, status: subscription.status });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// Replaces: verifyRazorpayPayment Cloud Function
export async function handleVerifyPayment(request: Request, env: Env): Promise<Response> {
  const userId = await verifyAuth(request, env);
  if (!userId) return errorResponse('Unauthenticated', 401);

  const { razorpayPaymentId, razorpaySubscriptionId, razorpaySignature } = await request.json() as any;
  if (!razorpayPaymentId || !razorpaySubscriptionId) return errorResponse('Missing payment details', 400);

  const razorpay = getRazorpay(env);
  const supabase = getSupabaseAdmin(env);

  try {
    const [subscription, payment] = await Promise.all([
      razorpay.fetchSubscription(razorpaySubscriptionId),
      razorpay.fetchPayment(razorpayPaymentId),
    ]);

    if (subscription.status === 'active' || subscription.status === 'authenticated') {
      const { data: sub } = await supabase
        .from('subscriptions').select('*').eq('id', razorpaySubscriptionId).single();

      if (!sub) return errorResponse('Subscription not found', 404);

      await supabase.from('subscriptions').update({
        status: 'active',
        current_start: subscription.current_start ? new Date(subscription.current_start * 1000).toISOString() : null,
        current_end: subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : null,
      }).eq('id', razorpaySubscriptionId);

      const planFeatures = getPlanFeatures(sub.plan_name);
      await supabase.from('users').update({
        plan: sub.plan_name,
        subscription_status: subscription.status,
        subscription_id: razorpaySubscriptionId,
        total_credits: getPlanCredits(sub.plan_name),
        credits_used: 0,
        credits_expiry_date: subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : null,
        max_video_length: planFeatures.maxVideoLength,
        export_quality: planFeatures.exportQuality,
        has_watermark: planFeatures.hasWatermark,
        has_ai_virality_score: planFeatures.hasAIViralityScore,
        has_custom_branding: planFeatures.hasCustomBranding,
        has_priority_processing: false,
        has_api_access: false,
      }).eq('id', userId);

      await supabase.from('transactions').insert({
        user_id: userId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_subscription_id: razorpaySubscriptionId,
        razorpay_customer_id: sub.razorpay_customer_id,
        razorpay_invoice_id: payment.invoice_id || null,
        plan_name: sub.plan_name,
        billing_period: sub.billing_period,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method || 'card',
        card_last4: payment.card?.last4 || null,
        card_network: payment.card?.network || null,
        description: `${sub.plan_name} Plan - ${sub.billing_period}`,
        paid_at: new Date().toISOString(),
      });

      return jsonResponse({ success: true, status: subscription.status });
    }

    return jsonResponse({ success: false, status: subscription.status });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// Replaces: cancelRazorpaySubscription Cloud Function
export async function handleCancelSubscription(request: Request, env: Env): Promise<Response> {
  const userId = await verifyAuth(request, env);
  if (!userId) return errorResponse('Unauthenticated', 401);

  const { subscriptionId, cancelAtCycleEnd } = await request.json() as any;
  if (!subscriptionId) return errorResponse('Missing subscription ID', 400);

  const razorpay = getRazorpay(env);
  const supabase = getSupabaseAdmin(env);

  try {
    await razorpay.cancelSubscription(subscriptionId, cancelAtCycleEnd);

    await supabase.from('subscriptions').update({
      status: cancelAtCycleEnd ? 'active' : 'cancelled',
      cancelled_at: new Date().toISOString(),
    }).eq('id', subscriptionId);

    if (!cancelAtCycleEnd) {
      const freeFeatures = getPlanFeatures('Free');
      await supabase.from('users').update({
        plan: 'Free',
        subscription_status: 'cancelled',
        total_credits: getPlanCredits('Free'),
        credits_used: 0,
        max_video_length: freeFeatures.maxVideoLength,
        export_quality: freeFeatures.exportQuality,
        has_watermark: freeFeatures.hasWatermark,
        has_ai_virality_score: freeFeatures.hasAIViralityScore,
        has_custom_branding: freeFeatures.hasCustomBranding,
      }).eq('id', userId);
    }

    return jsonResponse({ success: true });
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

// Replaces: razorpayWebhook Cloud Function (no auth — Razorpay calls this directly)
export async function handleRazorpayWebhook(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

  const signature = request.headers.get('x-razorpay-signature') || '';
  const payload = await request.text();

  const razorpay = getRazorpay(env);
  const isValid = await razorpay.verifyWebhookSignature(payload, signature);
  if (!isValid) return errorResponse('Invalid signature', 400);

  const body = JSON.parse(payload);
  const event = body.event;
  const eventData = body.payload;
  const supabase = getSupabaseAdmin(env);

  try {
    // Replaces Firebase's collectionGroup query — now a simple flat table query
    async function findSubscription(razorpaySubId: string) {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('razorpay_subscription_id', razorpaySubId)
        .single();
      return data;
    }

    switch (event) {
      case 'subscription.activated': {
        const sub = eventData.subscription.entity;
        const record = await findSubscription(sub.id);
        if (!record) break;
        await supabase.from('subscriptions').update({
          status: 'active',
          current_start: sub.current_start ? new Date(sub.current_start * 1000).toISOString() : null,
          current_end: sub.current_end ? new Date(sub.current_end * 1000).toISOString() : null,
        }).eq('id', sub.id);
        const features = getPlanFeatures(record.plan_name);
        await supabase.from('users').update({
          plan: record.plan_name,
          subscription_status: 'active',
          subscription_id: sub.id,
          total_credits: getPlanCredits(record.plan_name),
          credits_expiry_date: sub.current_end ? new Date(sub.current_end * 1000).toISOString() : null,
          ...Object.fromEntries(Object.entries(features).map(([k, v]) => [
            k.replace(/([A-Z])/g, '_$1').toLowerCase(), v
          ])),
        }).eq('id', record.user_id);
        break;
      }

      case 'subscription.charged': {
        const payment = eventData.payment.entity;
        const sub = eventData.subscription.entity;
        const record = await findSubscription(sub.id);
        if (!record) break;
        await supabase.from('transactions').insert({
          user_id: record.user_id,
          razorpay_payment_id: payment.id,
          razorpay_subscription_id: sub.id,
          razorpay_customer_id: record.razorpay_customer_id,
          razorpay_invoice_id: payment.invoice_id,
          plan_name: record.plan_name,
          billing_period: record.billing_period,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          description: `${record.plan_name} Plan - Renewal`,
          paid_at: payment.created_at ? new Date(payment.created_at * 1000).toISOString() : null,
        });
        await supabase.from('subscriptions').update({
          current_start: sub.current_start ? new Date(sub.current_start * 1000).toISOString() : null,
          current_end: sub.current_end ? new Date(sub.current_end * 1000).toISOString() : null,
        }).eq('id', sub.id);
        await supabase.from('users').update({
          credits_used: 0,
          credits_expiry_date: sub.current_end ? new Date(sub.current_end * 1000).toISOString() : null,
        }).eq('id', record.user_id);
        break;
      }

      case 'subscription.cancelled': {
        const sub = eventData.subscription.entity;
        const record = await findSubscription(sub.id);
        if (!record) break;
        await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('id', sub.id);
        const freeFeatures = getPlanFeatures('Free');
        await supabase.from('users').update({
          plan: 'Free',
          subscription_status: 'cancelled',
          total_credits: getPlanCredits('Free'),
        }).eq('id', record.user_id);
        break;
      }

      case 'subscription.halted':
      case 'subscription.paused':
      case 'subscription.resumed':
      case 'subscription.completed': {
        const sub = eventData.subscription.entity;
        const statusMap: Record<string, string> = {
          'subscription.halted': 'halted',
          'subscription.paused': 'paused',
          'subscription.resumed': 'active',
          'subscription.completed': 'expired',
        };
        const record = await findSubscription(sub.id);
        if (!record) break;
        await supabase.from('subscriptions').update({ status: statusMap[event] }).eq('id', sub.id);
        await supabase.from('users').update({ subscription_status: statusMap[event] }).eq('id', record.user_id);
        break;
      }
    }

    return jsonResponse({ status: 'success' });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return errorResponse('Webhook processing failed', 500);
  }
}
