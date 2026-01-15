/**
 * Video Validation Utility
 *
 * Validates uploaded videos in the browser using HTML5 Video API
 * Checks: format, size, duration, and basic codec compatibility
 */

export interface VideoValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    duration: number;
    width: number;
    height: number;
    size: number;
    type: string;
    canPlay: boolean;
  };
}

export const VIDEO_CONSTRAINTS = {
  MIN_DURATION: 30,          // 30 seconds
  MAX_DURATION: 3600,        // 1 hour
  MAX_SIZE: 5 * 1024 * 1024 * 1024,  // 5GB
  MIN_SIZE: 1024 * 1024,     // 1MB
  ALLOWED_TYPES: [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    'video/x-matroska'
  ],
  ALLOWED_CODECS: {
    'video/mp4': ['avc1', 'hev1', 'hvc1'],  // H.264, H.265
    'video/webm': ['vp8', 'vp9']
  }
};

/**
 * Validate a video file before upload
 * @param file - File object from input element
 * @returns VideoValidationResult with validation status and metadata
 */
export async function validateVideo(file: File): Promise<VideoValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. File size validation
  if (file.size < VIDEO_CONSTRAINTS.MIN_SIZE) {
    errors.push('Video file too small (minimum 1MB)');
  }
  if (file.size > VIDEO_CONSTRAINTS.MAX_SIZE) {
    errors.push('Video file too large (maximum 5GB)');
  }

  // 2. MIME type validation
  if (!VIDEO_CONSTRAINTS.ALLOWED_TYPES.includes(file.type)) {
    errors.push(`Unsupported video format: ${file.type || 'unknown'}`);
  }

  // 3. Load video metadata using HTML5 Video API
  let metadata: VideoValidationResult['metadata'];
  try {
    metadata = await loadVideoMetadata(file);
  } catch (error: any) {
    errors.push(error.message || 'Failed to load video metadata');
    // Return early with placeholder metadata
    return {
      isValid: false,
      errors,
      warnings,
      metadata: {
        duration: 0,
        width: 0,
        height: 0,
        size: file.size,
        type: file.type,
        canPlay: false
      }
    };
  }

  // 4. Duration validation
  if (metadata.duration < VIDEO_CONSTRAINTS.MIN_DURATION) {
    errors.push(`Video too short (minimum ${VIDEO_CONSTRAINTS.MIN_DURATION} seconds)`);
  }
  if (metadata.duration > VIDEO_CONSTRAINTS.MAX_DURATION) {
    errors.push(`Video too long (maximum ${VIDEO_CONSTRAINTS.MAX_DURATION / 60} minutes)`);
  }

  // 5. Playability check
  if (!metadata.canPlay) {
    errors.push('Video format not supported by your browser');
    warnings.push('Video may not be compatible with our processing system');
  }

  // 6. Resolution warnings
  if (metadata.width < 640 || metadata.height < 480) {
    warnings.push('Low resolution video may result in poor quality clips');
  }

  // 7. Aspect ratio warnings
  const aspectRatio = metadata.width / metadata.height;
  if (aspectRatio < 0.5 || aspectRatio > 2.5) {
    warnings.push('Unusual aspect ratio detected - clips may be cropped or letterboxed');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metadata
  };
}

/**
 * Load video metadata using HTML5 Video API
 * @param file - Video file
 * @returns Promise with video metadata
 */
async function loadVideoMetadata(file: File): Promise<VideoValidationResult['metadata']> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      // Check codec support using canPlayType
      const canPlay = video.canPlayType(file.type) !== '';

      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: file.size,
        type: file.type,
        canPlay
      });

      // Clean up
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      const error = video.error;
      let message = 'Failed to load video metadata';

      if (error) {
        switch (error.code) {
          case error.MEDIA_ERR_ABORTED:
            message = 'Video loading was aborted';
            break;
          case error.MEDIA_ERR_NETWORK:
            message = 'Network error while loading video';
            break;
          case error.MEDIA_ERR_DECODE:
            message = 'Video codec not supported or file corrupted';
            break;
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            message = 'Video format not supported';
            break;
        }
      }

      reject(new Error(message));
      URL.revokeObjectURL(video.src);
    };

    // Set timeout to prevent hanging
    const timeout = setTimeout(() => {
      reject(new Error('Video metadata loading timeout (10 seconds)'));
      URL.revokeObjectURL(video.src);
    }, 10000);  // 10 second timeout

    // Clear timeout on successful load
    video.addEventListener('loadedmetadata', () => {
      clearTimeout(timeout);
    });

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Format duration in seconds to MM:SS format
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00';

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format file size in bytes to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

/**
 * Get human-readable error message for validation errors
 * @param errors - Array of error messages
 * @returns User-friendly error summary
 */
export function getValidationSummary(errors: string[]): string {
  if (errors.length === 0) return 'Video is valid';
  if (errors.length === 1) return errors[0];
  return `${errors.length} issues found: ${errors[0]} and ${errors.length - 1} more`;
}
