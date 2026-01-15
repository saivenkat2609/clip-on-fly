/**
 * Real-time YouTube URL validation hook
 *
 * Features:
 * - Instant format validation (no API call)
 * - Debounced availability check via backend API
 * - Duration validation (must be ≤ 30 minutes)
 * - Credits calculation and checking
 * - Returns comprehensive validation status
 */

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/apiClient';
import { useRemainingCredits } from './useRemainingCredits';

interface ValidationResult {
  isValid: boolean;
  isValidating: boolean;
  error: string | null;
  videoInfo: {
    title: string;
    duration: number;
    durationFormatted: string;
    thumbnail: string;
    author: string;
  } | null;
  creditsRequired: number;
  hasEnoughCredits: boolean;
  validation: {
    isAvailable: boolean;
    isValidDuration: boolean;
    exceedsMaxLength: boolean;
  } | null;
}

const DEBOUNCE_DELAY = 800; // ms

/**
 * Validate YouTube URL format without API call
 */
function validateYouTubeUrlFormat(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  const trimmedUrl = url.trim();
  if (!trimmedUrl) return false;

  // YouTube URL patterns - must be exactly 11 characters for video ID
  const youtubePatterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}$/,
    /^https?:\/\/youtu\.be\/[\w-]{11}$/,
    /^https?:\/\/m\.youtube\.com\/watch\?v=[\w-]{11}$/,
  ];

  return youtubePatterns.some(pattern => pattern.test(trimmedUrl));
}

/**
 * Hook for real-time YouTube URL validation
 * Uses fast oEmbed API for instant feedback
 */
export function useYouTubeValidation(url: string): ValidationResult {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<Omit<ValidationResult, 'isValidating' | 'hasEnoughCredits'>>({
    isValid: false,
    error: null,
    videoInfo: null,
    creditsRequired: 0,
    validation: null,
  });

  const remainingCredits = useRemainingCredits();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Reset state if URL is empty
    if (!url.trim()) {
      setIsValidating(false);
      setValidationResult({
        isValid: false,
        error: null,
        videoInfo: null,
        creditsRequired: 0,
        validation: null,
      });
      return;
    }

    // Stage 1: Instant format validation
    const isFormatValid = validateYouTubeUrlFormat(url);

    if (!isFormatValid) {
      setIsValidating(false);
      setValidationResult({
        isValid: false,
        error: 'Please enter a valid YouTube URL (e.g., https://youtube.com/watch?v=...)',
        videoInfo: null,
        creditsRequired: 0,
        validation: null,
      });
      return;
    }

    // Stage 2: Debounced quick validation using YouTube oEmbed
    setIsValidating(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        // Use YouTube's oEmbed API for fast validation (< 1 second)
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const response = await fetch(oembedUrl);

        if (!response.ok) {
          // Video not available (private, deleted, etc.)
          setIsValidating(false);
          setValidationResult({
            isValid: false,
            error: 'Video not available. It may be private, deleted, or restricted.',
            videoInfo: null,
            creditsRequired: 0,
            validation: {
              isAvailable: false,
              isValidDuration: false,
              exceedsMaxLength: false,
            },
          });
          return;
        }

        const data = await response.json();

        // Video is available! Show basic info from oEmbed first
        setValidationResult({
          isValid: true,
          error: null,
          videoInfo: {
            title: data.title || 'Unknown Title',
            duration: 0, // oEmbed doesn't provide duration
            durationFormatted: 'Checking duration...',
            thumbnail: data.thumbnail_url || '',
            author: data.author_name || 'Unknown',
          },
          creditsRequired: 0,
          validation: {
            isAvailable: true,
            isValidDuration: true,
            exceedsMaxLength: false,
          },
        });

        // Stage 3: Now call backend for full validation (duration, credits)
        try {
          const abortController = new AbortController();
          abortControllerRef.current = abortController;

          const backendValidation = await apiClient.get(
            `/validate-youtube?url=${encodeURIComponent(url)}`,
            {
              skipCache: true,
              signal: abortController.signal
            }
          );

          // Update with full validation data from backend
          if (backendValidation.isValid) {
            setValidationResult({
              isValid: true,
              error: null,
              videoInfo: backendValidation.videoInfo,
              creditsRequired: backendValidation.creditsRequired,
              validation: backendValidation.validation,
            });
          } else {
            // Backend validation failed (too long, too short, etc.)
            setValidationResult({
              isValid: false,
              error: backendValidation.error,
              videoInfo: backendValidation.videoInfo,
              creditsRequired: backendValidation.creditsRequired,
              validation: backendValidation.validation,
            });
          }

          setIsValidating(false);
        } catch (backendError: any) {
          // Backend validation failed, but oEmbed succeeded
          // Keep the oEmbed data but show warning
          if (backendError.name === 'AbortError') {
            // Request was cancelled, ignore
            return;
          }

          console.error('[Validation] Backend validation failed:', backendError);
          setValidationResult({
            isValid: false,
            error: 'Unable to verify video duration. Please try again.',
            videoInfo: {
              title: data.title || 'Unknown Title',
              duration: 0,
              durationFormatted: 'Unknown',
              thumbnail: data.thumbnail_url || '',
              author: data.author_name || 'Unknown',
            },
            creditsRequired: 0,
            validation: {
              isAvailable: true,
              isValidDuration: false,
              exceedsMaxLength: false,
            },
          });
          setIsValidating(false);
        }
      } catch (error: any) {
        setIsValidating(false);
        setValidationResult({
          isValid: false,
          error: 'Failed to validate video. Please check the URL and try again.',
          videoInfo: null,
          creditsRequired: 0,
          validation: null,
        });
      }
    }, DEBOUNCE_DELAY);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [url]);

  // Check if user has enough credits
  const hasEnoughCredits = validationResult.creditsRequired > 0
    ? remainingCredits >= validationResult.creditsRequired
    : true;

  return {
    ...validationResult,
    isValidating,
    hasEnoughCredits,
  };
}
