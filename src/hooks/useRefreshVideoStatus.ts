/**
 * LAYER 3 RESILIENCE: Hook for refreshing stuck video status
 *
 * When a video is stuck in "processing" state but clips are ready in S3/R2,
 * this hook fetches result.json from storage and syncs to Firestore.
 *
 * Use case:
 * - Firestore sync failed in finalize Lambda
 * - Reconciliation Lambda hasn't run yet (< 5 minutes)
 * - User wants immediate access to clips
 */

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

interface RefreshStatusResult {
  success: boolean;
  status: string;
  clips: any[];
  message?: string;
  error?: string;
}

export function useRefreshVideoStatus() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);

  /**
   * Refresh video status from S3 and sync to Firestore
   *
   * @param userId - Firebase user ID
   * @param sessionId - Video session ID
   * @returns Result with clips data
   */
  const refreshStatus = async (
    userId: string,
    sessionId: string
  ): Promise<RefreshStatusResult> => {
    if (!userId || !sessionId) {
      return {
        success: false,
        status: 'error',
        clips: [],
        error: 'Missing user ID or session ID'
      };
    }

    setIsRefreshing(true);

    try {
      console.log(`[Refresh] Fetching status from S3 for session: ${sessionId}`);

      // Fetch result from backend (which reads from S3)
      const result = await apiClient.refreshVideoStatus(sessionId);

      if (!result.success) {
        // Still processing or error
        toast.error(result.error || 'Video is still processing');
        return result;
      }

      // Success! Update Firestore
      console.log(`[Refresh] ✓ Got ${result.clips.length} clips from S3`);
      console.log(`[Refresh] Syncing to Firestore...`);

      const clips = result.clips.map((clip: any) => ({
        clipIndex: clip.clip_index,
        downloadUrl: clip.download_url,
        s3Key: clip.s3_key,
        duration: clip.duration,
        startTime: clip.startTime || clip.start,
        endTime: clip.endTime || clip.end,
        title: clip.title,
        virality_score: clip.virality_score,
        score_breakdown: clip.score_breakdown,
        template_id: clip.template_id,
        template_name: clip.template_name,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      }));

      await supabase.from('videos').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        clips,
        updated_at: new Date().toISOString(),
      }).eq('id', sessionId).eq('user_id', userId);

      console.log(`[Refresh] ✓ Firestore updated successfully`);

      setLastRefreshTime(new Date());

      toast.success(`✓ Status refreshed! ${result.clips.length} clips ready`);

      return result;

    } catch (error: any) {
      console.error('[Refresh] Error:', error);

      const errorMessage = error.message || 'Failed to refresh status';
      toast.error(errorMessage);

      return {
        success: false,
        status: 'error',
        clips: [],
        error: errorMessage
      };
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    refreshStatus,
    isRefreshing,
    lastRefreshTime
  };
}
