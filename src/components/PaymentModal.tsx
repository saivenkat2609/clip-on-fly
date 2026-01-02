import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateSubscription, useVerifyPayment } from '@/hooks/useSubscription';
import { openRazorpayCheckout } from '@/lib/razorpay';
import { useToast } from '@/hooks/use-toast';
import { formatPrice, type PlanName, type BillingPeriod, type Currency } from '@/lib/pricing';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: PlanName;
  billingPeriod: BillingPeriod;
  amount: number;
  currency: Currency;
}

export function PaymentModal({
  isOpen,
  onClose,
  planName,
  billingPeriod,
  amount,
  currency,
}: PaymentModalProps) {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const createSubscription = useCreateSubscription();
  const verifyPayment = useVerifyPayment();

  const handlePayment = async () => {
    if (!currentUser) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to continue.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create subscription in backend
      toast({
        title: 'Creating subscription...',
        description: 'Please wait while we prepare your payment.',
      });

      const subscriptionData = await createSubscription.mutateAsync({
        planName,
        billingPeriod,
        currency,
      });

      // Step 2: Close this modal BEFORE opening Razorpay
      // This prevents modal stacking and focus issues
      onClose();

      // Small delay to ensure modal closes completely
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 3: Open Razorpay checkout (modal is now closed)
      await openRazorpayCheckout({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        subscription_id: subscriptionData.subscriptionId,
        name: 'NebulaAI',
        description: `${planName} Plan - ${billingPeriod}`,
        handler: async (response) => {
          // Step 4: Verify payment on backend
          try {
            toast({
              title: 'Verifying payment...',
              description: 'Please wait a moment.',
            });

            const result = await verifyPayment.mutateAsync({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySubscriptionId: response.razorpay_subscription_id,
              razorpaySignature: response.razorpay_signature,
            });

            if (result.success) {
              toast({
                title: 'Success! 🎉',
                description: 'Your subscription has been activated successfully.',
              });

              // Force refresh to update UI
              window.location.reload();
            } else {
              toast({
                title: 'Payment Verification Failed',
                description: 'Please contact support if this issue persists.',
                variant: 'destructive',
              });
            }
          } catch (error: any) {
            toast({
              title: 'Payment Verification Failed',
              description: error.message || 'Please contact support.',
              variant: 'destructive',
            });
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast({
              title: 'Payment Cancelled',
              description: 'You can try again anytime.',
            });
          },
          escape: false, // Prevent accidental closure with ESC key
          backdropclose: false, // Prevent closing by clicking outside
        },
        prefill: {
          name: currentUser.displayName || '',
          email: currentUser.email || '',
        },
        theme: {
          color: '#6366f1',
        },
      });
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'Payment Failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
      setIsProcessing(false);
      onClose(); // Close modal on error
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Prevent closing while processing
      if (!isProcessing && !open) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => {
        // Prevent closing by clicking outside while processing
        if (isProcessing) {
          e.preventDefault();
        }
      }}>
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
          <DialogDescription>
            Subscribe to {planName} Plan ({billingPeriod})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Plan Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Plan</span>
              <Badge className="bg-primary">{planName}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Billing</span>
              <span className="font-medium capitalize">{billingPeriod}</span>
            </div>
            {billingPeriod === 'yearly' && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Savings</span>
                <Badge variant="outline" className="bg-green-500/10 text-green-600">
                  Save 20%
                </Badge>
              </div>
            )}
            <div className="flex items-center justify-between border-t pt-3">
              <span className="font-semibold">Total</span>
              <span className="text-2xl font-bold">
                {formatPrice(amount, currency)}
              </span>
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full gradient-primary"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Pay with Razorpay
              </>
            )}
          </Button>

          {/* Security Note */}
          <div className="flex items-center gap-2 text-xs text-center text-muted-foreground justify-center">
            <Lock className="h-3 w-3" />
            <span>
              Secure payment powered by Razorpay. Your payment information is encrypted and secure.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
