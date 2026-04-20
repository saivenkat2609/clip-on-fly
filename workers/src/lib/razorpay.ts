// Razorpay API via fetch — replaces the razorpay npm SDK (which uses Node.js internals)
// Workers support fetch natively so this is cleaner

export class RazorpayClient {
  private baseUrl = 'https://api.razorpay.com/v1';
  private authHeader: string;
  private webhookSecret: string;

  constructor(keyId: string, keySecret: string, webhookSecret: string) {
    this.authHeader = `Basic ${btoa(`${keyId}:${keySecret}`)}`;
    this.webhookSecret = webhookSecret;
  }

  private async request(method: string, path: string, body?: object) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json() as any;
    if (!res.ok) throw new Error(data.error?.description || 'Razorpay API error');
    return data;
  }

  async createCustomer(email: string, name: string) {
    return this.request('POST', '/customers', { email, name, fail_existing: 0 });
  }

  async createSubscription(customerId: string, planId: string, notifyEmail: string) {
    return this.request('POST', '/subscriptions', {
      plan_id: planId,
      customer_id: customerId,
      customer_notify: 1,
      total_count: 12,
      quantity: 1,
      notify_info: { notify_email: notifyEmail },
    });
  }

  async fetchSubscription(subscriptionId: string) {
    return this.request('GET', `/subscriptions/${subscriptionId}`);
  }

  async cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean) {
    return this.request('POST', `/subscriptions/${subscriptionId}/cancel`, {
      cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0,
    });
  }

  async fetchPayment(paymentId: string) {
    return this.request('GET', `/payments/${paymentId}`);
  }

  async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    const { verifyHmacSha256 } = await import('./crypto');
    return verifyHmacSha256(payload, signature, this.webhookSecret);
  }
}

export { getRazorpayPlanId, getPlanCredits, getPlanFeatures } from './planMapping';
