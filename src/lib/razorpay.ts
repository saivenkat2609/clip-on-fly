/**
 * Razorpay Checkout Integration
 * Handles loading Razorpay SDK and opening checkout modal
 */

export interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  handler: (response: RazorpaySuccessResponse) => void;
  modal: {
    ondismiss: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
  prefill: {
    name: string;
    email: string;
    contact?: string;
  };
  theme: {
    color: string;
  };
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

/**
 * Load Razorpay Checkout script
 * Returns true if loaded successfully, false otherwise
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if already loaded
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    // Handle load success
    script.onload = () => {
      console.log('Razorpay SDK loaded successfully');
      resolve(true);
    };

    // Handle load error
    script.onerror = () => {
      console.error('Failed to load Razorpay SDK');
      resolve(false);
    };

    // Append to document
    document.body.appendChild(script);
  });
};

/**
 * Open Razorpay Checkout modal
 * Loads SDK if not already loaded, then opens payment modal
 */
export const openRazorpayCheckout = async (options: RazorpayOptions): Promise<void> => {
  // Load SDK if not already loaded
  const loaded = await loadRazorpayScript();

  if (!loaded) {
    throw new Error('Failed to load Razorpay SDK. Please check your internet connection and try again.');
  }

  // Create Razorpay instance
  const rzp = new window.Razorpay(options);

  // Open checkout modal
  rzp.open();
};

/**
 * Verify payment signature (client-side validation)
 * Note: This is NOT a replacement for server-side verification
 * Always verify on backend using webhook signature verification
 */
export const verifyPaymentSignature = (
  razorpayPaymentId: string,
  razorpaySubscriptionId: string,
  razorpaySignature: string
): boolean => {
  // This is just a basic check - real verification happens on backend
  return !!(razorpayPaymentId && razorpaySubscriptionId && razorpaySignature);
};
