import { useMemo } from "react";
import { useUserPlanRealtime } from "./useUserProfile";

/**
 * Shared hook for calculating remaining credits
 * Used across Dashboard, Upload, and UploadHero
 *
 * IMPORTANT: Uses REAL-TIME backend creditsUsed value from Firestore
 * Updates immediately when credits change - no caching delays
 */
export function useRemainingCredits() {
  const { totalCredits = 0, creditsUsed = 0 } = useUserPlanRealtime();

  // Calculate remaining credits using backend value
  const remainingCredits = useMemo(() => {
    return Math.max(0, totalCredits - creditsUsed);
  }, [totalCredits, creditsUsed]);

  return remainingCredits;
}
