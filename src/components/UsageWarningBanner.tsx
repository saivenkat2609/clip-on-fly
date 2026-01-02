import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserPlan } from '@/hooks/useUserProfile';
import { useNavigate } from 'react-router-dom';

export function UsageWarningBanner() {
  const navigate = useNavigate();
  const { plan, totalCredits, creditsUsed = 0 } = useUserPlan();

  // Use backend creditsUsed value (tracked in Firestore)
  const usagePercentage = totalCredits > 0 ? (creditsUsed / totalCredits) * 100 : 0;

  // Don't show banner if usage is below 75%
  if (usagePercentage < 75) return null;

  const getAlertVariant = () => {
    if (usagePercentage >= 100) return 'destructive';
    if (usagePercentage >= 90) return 'destructive';
    return 'default';
  };

  const getTitle = () => {
    if (usagePercentage >= 100) return 'Credit Limit Reached';
    if (usagePercentage >= 90) return 'Running Low on Credits';
    return 'Credits Alert';
  };

  const getMessage = () => {
    if (usagePercentage >= 100) {
      return `You've used all ${totalCredits} minutes. Upgrade to continue processing videos.`;
    }
    if (usagePercentage >= 90) {
      return `You've used ${creditsUsed} of ${totalCredits} minutes (${Math.round(usagePercentage)}%). Consider upgrading for more credits.`;
    }
    return `You've used ${creditsUsed} of ${totalCredits} minutes (${Math.round(usagePercentage)}%). You're approaching your limit.`;
  };

  return (
    <Alert variant={getAlertVariant()} className="mb-6">
      {usagePercentage >= 90 ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <Zap className="h-4 w-4" />
      )}
      <AlertTitle>{getTitle()}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span className="flex-1">{getMessage()}</span>
        {plan === 'Free' && (
          <Button
            variant={usagePercentage >= 90 ? 'default' : 'outline'}
            size="sm"
            onClick={() => navigate('/billing')}
            className="ml-4"
          >
            Upgrade Plan
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
