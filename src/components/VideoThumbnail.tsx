import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

interface VideoThumbnailProps {
  videoUrl: string;
  alt: string;
  onClick?: () => void;
  showPlayButton?: boolean;
}

export function VideoThumbnail({
  videoUrl,
  alt,
  onClick,
  showPlayButton = true
}: VideoThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
  }, [videoUrl]);

  return (
    <div
      className={`relative w-full h-full ${onClick ? 'cursor-pointer' : ''} group`}
      onClick={onClick}
    >
      {/* Hidden video element for frame extraction */}
      <video
        ref={videoRef}
        src={videoUrl}
        preload="metadata"
        className="hidden"
        crossOrigin="anonymous"
      />

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Thumbnail image */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          {isLoading ? (
            <div className="animate-pulse">
              <Play className="h-16 w-16 text-white/40" />
            </div>
          ) : (
            <Play className="h-16 w-16 text-white/80" />
          )}
        </div>
      )}

      {/* Play overlay */}
      {showPlayButton && onClick && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-indigo-600 rounded-full p-4 shadow-lg transform group-hover:scale-110 transition-transform">
              <Play className="h-8 w-8 text-white fill-white" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
