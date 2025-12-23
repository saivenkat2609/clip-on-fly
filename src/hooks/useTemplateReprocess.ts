/**
 * Custom hook for reprocessing clips with new templates
 * Handles API calls, loading states, and error handling with async polling
 */

import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

interface ReprocessOptions {
  session_id: string;
  clip_index: number;
  template_id: string;
}

interface ReprocessResponse {
  statusCode?: number;
  session_id: string;
  clip_index: number;
  template_id: string;
  template_name?: string;
  s3_clip_key?: string;
  download_url?: string;
  message?: string;
  status?: string;
}

export function useTemplateReprocess() {
  const [reprocessing, setReprocessing] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  /**
   * Poll result.json for updated clip data
   */
  const pollForResult = async (
    session_id: string,
    clip_index: number,
    template_id: string,
    maxAttempts = 60 // 60 attempts * 3 seconds = 3 minutes max
  ): Promise<ReprocessResponse | null> => {
    // Record the start time to detect new updates
    const startTime = Date.now();
    console.log('[TemplateReprocess] Starting poll at:', new Date(startTime).toISOString());

    // Get the original clip data before polling
    let originalClip: any = null;
    try {
      const initialResult = await apiClient.get(`/result/${session_id}`);
      originalClip = initialResult.clips?.find((c: any) => c.clip_index === clip_index);
      console.log('[TemplateReprocess] Original clip:', {
        template_id: originalClip?.template_id,
        s3_key: originalClip?.s3_key,
        last_updated: originalClip?.last_updated
      });
    } catch (err) {
      console.warn('[TemplateReprocess] Failed to get original clip data:', err);
    }

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Wait 3 seconds between polls (reprocessing takes ~55s)
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log(`[TemplateReprocess] Polling attempt ${attempt + 1}/${maxAttempts}`);

        // Fetch updated result.json with cache-busting timestamp
        const result = await apiClient.get(`/result/${session_id}?_=${Date.now()}`);
        const updatedClip = result.clips?.find((c: any) => c.clip_index === clip_index);

        if (!updatedClip) {
          console.warn('[TemplateReprocess] Clip not found in result');
          continue;
        }

        // STRICT CHECK: Only succeed if reprocessing actually completed
        const templateMatches = updatedClip.template_id === template_id;
        const hasReprocessedFlag = updatedClip.reprocessed === true;

        // Check if last_updated is newer than when we started polling
        let hasNewTimestamp = false;
        if (updatedClip.last_updated) {
          const lastUpdatedTime = new Date(updatedClip.last_updated).getTime();
          hasNewTimestamp = lastUpdatedTime > startTime;
        }

        console.log('[TemplateReprocess] Check status:', {
          templateMatches,
          hasReprocessedFlag,
          hasNewTimestamp,
          current_template: updatedClip.template_id,
          expected_template: template_id,
          last_updated: updatedClip.last_updated,
          startTime: new Date(startTime).toISOString()
        });

        // SUCCESS: Template matches AND (reprocessed flag OR new timestamp)
        // This ensures we don't succeed until reprocessing actually completes
        if (templateMatches && (hasReprocessedFlag || hasNewTimestamp)) {
          console.log('[TemplateReprocess] ✅ Clip updated successfully!');

          // Force aggressive cache busting on the download URL
          const cacheBuster = Date.now();
          let freshUrl = updatedClip.download_url || updatedClip.s3_key;

          // Add cache buster to URL
          if (freshUrl) {
            const separator = freshUrl.includes('?') ? '&' : '?';
            freshUrl = `${freshUrl}${separator}_cb=${cacheBuster}&_reload=${Math.random()}`;
          }

          return {
            session_id,
            clip_index,
            template_id: updatedClip.template_id,
            template_name: updatedClip.template_name,
            s3_clip_key: updatedClip.s3_key,
            download_url: freshUrl,
            message: 'Clip reprocessed successfully',
          };
        }
      } catch (err) {
        console.warn(`[TemplateReprocess] Poll attempt ${attempt + 1} failed:`, err);
        // Continue polling even if one attempt fails
      }
    }

    // Timeout after max attempts
    throw new Error('Reprocessing timed out. Please refresh the page to check if it completed.');
  };

  /**
   * Reprocess a clip with a new template (async with polling)
   * @param options - Reprocess options
   * @returns Promise with the new clip data
   */
  const reprocessClip = async ({
    session_id,
    clip_index,
    template_id,
  }: ReprocessOptions): Promise<ReprocessResponse | null> => {
    try {
      // Set loading state for this specific clip
      setReprocessing(prev => ({ ...prev, [clip_index]: true }));
      setError(null);

      console.log('[TemplateReprocess] Starting reprocess:', {
        session_id,
        clip_index,
        template_id,
      });

      // Call reprocess API endpoint (returns 202 and processes in background)
      const response: any = await apiClient.post('/reprocess-clip', {
        session_id,
        clip_index,
        template_id,
      });

      console.log('[TemplateReprocess] Reprocess response:', response);

      // Show processing toast (no premature success message)
      toast.loading('Processing...', {
        description: 'Reprocessing video with new subtitle style. This may take up to 60 seconds.',
        duration: Infinity, // Keep showing until we dismiss it
        id: `reprocess-${clip_index}`, // Unique ID to update/dismiss later
      });

      // Poll for result
      const result = await pollForResult(session_id, clip_index, template_id);

      if (result) {
        console.log('[TemplateReprocess] Success:', result);

        // Dismiss loading toast and show success
        toast.dismiss(`reprocess-${clip_index}`);
        toast.success('✨ Template Applied Successfully!', {
          description: `Your clip has been updated with the new subtitle style.`,
          duration: 4000,
        });

        return result;
      }

      // If we get here, polling timed out - dismiss loading toast
      toast.dismiss(`reprocess-${clip_index}`);

      return null;
    } catch (err: any) {
      console.error('[TemplateReprocess] Error:', err);
      const errorMessage = err.message || 'Failed to reprocess clip';
      setError(errorMessage);

      // Dismiss loading toast and show error
      toast.dismiss(`reprocess-${clip_index}`);
      toast.error('Reprocess Failed', {
        description: errorMessage,
        duration: 5000,
      });

      return null;
    } finally {
      // Clear loading state
      setReprocessing(prev => ({ ...prev, [clip_index]: false }));
    }
  };

  /**
   * Check if a specific clip is currently reprocessing
   */
  const isReprocessing = (clipIndex: number): boolean => {
    return reprocessing[clipIndex] || false;
  };

  /**
   * Check if any clip is currently reprocessing
   */
  const isAnyReprocessing = (): boolean => {
    return Object.values(reprocessing).some(Boolean);
  };

  return {
    reprocessClip,
    isReprocessing,
    isAnyReprocessing,
    error,
  };
}
