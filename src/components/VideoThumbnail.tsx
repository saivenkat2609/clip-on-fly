import { useEffect, useRef, useState, memo } from "react";
import { Play } from "lucide-react";

interface VideoThumbnailProps {
  videoUrl?: string;
  youtubeThumbnail?: string;
  youtubeUrl?: string;
  alt: string;
  onClick?: () => void;
  showPlayButton?: boolean;
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;

  // Handle youtu.be short links
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return shortMatch[1];

  // Handle youtube.com/watch?v= links
  const watchMatch = url.match(/[?&]v=([^?&]+)/);
  if (watchMatch) return watchMatch[1];

  // Handle youtube.com/embed/ links
  const embedMatch = url.match(/embed\/([^?&]+)/);
  if (embedMatch) return embedMatch[1];

  return null;
};

/**
 * Get best quality YouTube thumbnail URL
 */
const getYouTubeThumbnail = (videoId: string): string => {
  // Try maxresdefault first (1920x1080), fallback to hqdefault (480x360)
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

const VideoThumbnailComponent = ({
  videoUrl,
  youtubeThumbnail,
  youtubeUrl,
  alt,
  onClick,
  showPlayButton = true
}: VideoThumbnailProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [useYouTubeThumbnail, setUseYouTubeThumbnail] = useState<string | null>(null);

  // Check if we should use YouTube thumbnail
  useEffect(() => {
    // Priority 1: Direct YouTube thumbnail URL from backend
    if (youtubeThumbnail) {
      setUseYouTubeThumbnail(youtubeThumbnail);
      setIsLoading(false);
      return;
    }

    // Priority 2: Extract from YouTube URL
    if (youtubeUrl) {
      const videoId = extractYouTubeId(youtubeUrl);
      if (videoId) {
        const ytThumb = getYouTubeThumbnail(videoId);
        setUseYouTubeThumbnail(ytThumb);
        setIsLoading(false);
        return;
      }
    }

    // Priority 3: Use video frame extraction
    setUseYouTubeThumbnail(null);
  }, [youtubeThumbnail, youtubeUrl]);

  // Video frame extraction (only if not using YouTube thumbnail)
  useEffect(() => {
    // Skip frame extraction if using YouTube thumbnail
    if (useYouTubeThumbnail !== null) {
      return;
    }

    // Must have videoUrl for frame extraction
    if (!videoUrl) {
      setIsLoading(false);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      return;
    }

    const handleLoadedData = () => {
      try {
        // Seek to 0.5 seconds to get a better frame (skip black frames)
        video.currentTime = 0.5;
      } catch (error) {
        setIsLoading(false);
      }
    };

    const handleSeeked = () => {
      try {
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the frame
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Convert to data URL
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
          setThumbnailUrl(dataUrl);
          setIsLoading(false);
        } else {
          console.error("[VideoThumbnail] Could not get canvas 2d context");
          setIsLoading(false);
        }
      } catch (error) {
        console.error("[VideoThumbnail] Error extracting thumbnail:", error);
        setIsLoading(false);
      }
    };

    const handleError = (e: Event) => {
      console.error("[VideoThumbnail] Error loading video:", e);
      console.error("[VideoThumbnail] Video error code:", (video as HTMLVideoElement).error?.code);
      console.error("[VideoThumbnail] Video error message:", (video as HTMLVideoElement).error?.message);
      setIsLoading(false);
    };

    const handleLoadStart = () => {
    };

    const handleCanPlay = () => {
    };

    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("seeked", handleSeeked);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
    };
  }, [videoUrl, useYouTubeThumbnail]);

  return (
    <div
      className={`relative w-full h-full ${onClick ? 'cursor-pointer' : ''} group overflow-hidden`}
      onClick={onClick}
    >
      {/* Hidden video element for frame extraction (only loaded when needed) */}
      {!useYouTubeThumbnail && videoUrl && (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            preload="metadata"
            className="hidden"
            crossOrigin="anonymous"
          />
          <canvas ref={canvasRef} className="hidden" />
        </>
      )}

      {/* Thumbnail Display */}
      {useYouTubeThumbnail ? (
        // YouTube thumbnail (fast loading, high quality)
        <img
          src={useYouTubeThumbnail}
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
          onError={(e) => {
            // Fallback to lower quality if maxresdefault doesn't exist
            const target = e.target as HTMLImageElement;
            if (target.src.includes('maxresdefault')) {
              target.src = target.src.replace('maxresdefault', 'hqdefault');
            }
          }}
        />
      ) : thumbnailUrl ? (
        // Video frame thumbnail (for uploaded videos)
        <img
          src={thumbnailUrl}
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
      ) : (
        // Loading or error state
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 flex items-center justify-center backdrop-blur-sm">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 animate-ping">
                  <Play className="h-12 w-12 text-primary/30" />
                </div>
                <Play className="h-12 w-12 text-primary/50" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">Loading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Play className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">No preview</p>
            </div>
          )}
        </div>
      )}

      {/* Play Button Overlay - Sleeker design */}
      {showPlayButton && onClick && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
          <div className="transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-primary rounded-full blur-xl opacity-50"></div>
              {/* Button */}
              <div className="relative bg-gradient-to-br from-primary to-primary-dark rounded-full p-4 shadow-2xl">
                <Play className="h-6 w-6 text-primary-foreground fill-primary-foreground" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export const VideoThumbnail = memo(VideoThumbnailComponent, (prevProps, nextProps) => {
  return (
    prevProps.videoUrl === nextProps.videoUrl &&
    prevProps.youtubeThumbnail === nextProps.youtubeThumbnail &&
    prevProps.youtubeUrl === nextProps.youtubeUrl &&
    prevProps.alt === nextProps.alt &&
    prevProps.showPlayButton === nextProps.showPlayButton &&
    prevProps.onClick === nextProps.onClick
  );
});
