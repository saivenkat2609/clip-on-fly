import Razorpay from 'razorpay';
import * as crypto from 'crypto';

export class RazorpayClient {
  private razorpay: Razorpay;
  private webhookSecret: string;

  constructor(keyId: string, keySecret: string, webhookSecret: string) {
    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    this.webhookSecret = webhookSecret;
  }

  /**
   * Verify webhook signature using HMAC-SHA256
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');
      return expectedSignature === signature;
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Create or get Razorpay customer
   * Uses fail_existing: '0' to return existing customer if found
   */
  async createCustomer(email: string, name: string, contact?: string) {
    try {
      return await this.razorpay.customers.create({
        email,
        name,
        contact,
        fail_existing: '0', // Return existing customer if found
      });
    } catch (error: any) {
      console.error('Create customer error:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(
    customerId: string,
    planId: string,
    notifyInfo?: {
      notify_email?: string;
      notify_sms?: string;
    }
  ) {
    try {
      return await this.razorpay.subscriptions.create({
        plan_id: planId,
        customer_id: customerId,
        total_count: 12, // For yearly plans - 12 months
        quantity: 1,
        notify_info: notifyInfo,
        addons: [],
        notes: {},
      });
    } catch (error: any) {
      console.error('Create subscription error:', error);
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  /**
   * Cancel subscription
   * @param cancelAtCycleEnd - If true, subscription will be cancelled at the end of current billing cycle
   */
  async cancelSubscription(subscriptionId: string, cancelAtCycleEnd: boolean = true) {
    try {
      return await this.razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(subscriptionId: string) {
    try {
      return await this.razorpay.subscriptions.pause(subscriptionId);
    } catch (error: any) {
      console.error('Pause subscription error:', error);
      throw new Error(`Failed to pause subscription: ${error.message}`);
    }
  }

  /**
   * Resume subscription
   */
  async resumeSubscription(subscriptionId: string) {
    try {
      return await this.razorpay.subscriptions.resume(subscriptionId);
    } catch (error: any) {
      console.error('Resume subscription error:', error);
      throw new Error(`Failed to resume subscription: ${error.message}`);
    }
  }

  /**
   * Fetch subscription details
   */
  async fetchSubscription(subscriptionId: string) {
    try {
      return await this.razorpay.subscriptions.fetch(subscriptionId);
    } catch (error: any) {
      console.error('Fetch subscription error:', error);
      throw new Error(`Failed to fetch subscription: ${error.message}`);
    }
  }

  /**
   * Fetch all payments for a subscription
   */
  async fetchSubscriptionPayments(subscriptionId: string) {
    try {
      return await this.razorpay.subscriptions.fetchAllPayments(subscriptionId);
    } catch (error: any) {
      console.error('Fetch subscription payments error:', error);
      throw new Error(`Failed to fetch subscription payments: ${error.message}`);
    }
  }

  /**
   * Fetch customer details
   */
  async fetchCustomer(customerId: string) {
    try {
      return await this.razorpay.customers.fetch(customerId);
    } catch (error: any) {
      console.error('Fetch customer error:', error);
      throw new Error(`Failed to fetch customer: ${error.message}`);
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(
    subscriptionId: string,
    updates: {
      plan_id?: string;
      quantity?: number;
      schedule_change_at?: string;
    }
  ) {
    try {
      return await this.razorpay.subscriptions.update(subscriptionId, updates);
    } catch (error: any) {
      console.error('Update subscription error:', error);
      throw new Error(`Failed to update subscription: ${error.message}`);
    }
  }
}
