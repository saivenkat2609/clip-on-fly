import { useMemo } from "react";
import { useUserPlan } from "./useUserProfile";
import { useVideos } from "./useVideos";

/**
 * Shared hook for calculating remaining credits
 * Used across Dashboard, Upload, and UploadHero
 */
export function useRemainingCredits() {
  const { totalCredits = 0 } = useUserPlan();
  const { data: videos = [] } = useVideos();

  // Calculate remaining credits - same calculation as Dashboard
  const remainingCredits = useMemo(() => {
    if (!videos || videos.length === 0 || totalCredits === 0) {
      return totalCredits;
    }

    // Calculate used credits (sum of all video durations in minutes)
    const usedCredits = videos.reduce((sum, video) => {
      if (video.videoInfo?.duration) {
        // Duration is in seconds, convert to minutes
        return sum + Math.floor(video.videoInfo.duration / 60);
      }
      return sum;
    }, 0);

    return Math.max(0, totalCredits - usedCredits);
  }, [videos, totalCredits]);

  return remainingCredits;
}
