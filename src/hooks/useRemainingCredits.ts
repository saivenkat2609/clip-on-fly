import { useMemo } from "react";
import { useUserPlan } from "./useUserProfile";

/**
 * Shared hook for calculating remaining credits
 * Used across Dashboard, Upload, and UploadHero
 *
 * IMPORTANT: Uses backend creditsUsed value from Firestore
 * This ensures credits reset properly when subscriptions are activated
 */
export function useRemainingCredits() {
  const { totalCredits = 0, creditsUsed = 0 } = useUserPlan();

  // Calculate remaining credits using backend value
  const remainingCredits = useMemo(() => {
    return Math.max(0, totalCredits - creditsUsed);
  }, [totalCredits, creditsUsed]);

  return remainingCredits;
}
