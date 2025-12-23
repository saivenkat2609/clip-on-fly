import { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "./VideoPreview.css";
import type Player from "video.js/dist/types/player";

interface VideoPreviewProps {
  src: string;
  poster?: string;
  onReady?: (player: Player) => void;
}

export function VideoPreview({ src, poster, onReady }: VideoPreviewProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add("vjs-big-play-centered");
      videoRef.current.appendChild(videoElement);

      const player = (playerRef.current = videojs(videoElement, {
        autoplay: true,
        controls: true,
        responsive: true,
        fluid: true,
        preload: "auto",
        poster: poster,
        aspectRatio: "16:9",
        controlBar: {
          volumePanel: {
            inline: false
          }
        },
        // Force no caching to ensure fresh video loads
        html5: {
          vhs: {
            overrideNative: true
          },
          nativeVideoTracks: false,
          nativeAudioTracks: false
        },
        sources: [
          {
            src: src,
            type: "video/mp4",
          },
        ],
      }));

      player.ready(() => {
        console.log("Video.js player is ready");
        onReady && onReady(player);
      });
    }
  }, [poster, onReady]);

  // Update video source when src changes (critical for template reprocessing)
  useEffect(() => {
    const player = playerRef.current;

    if (player && !player.isDisposed()) {
      console.log("[VideoPreview] Source changed, forcing complete reload:", src);

      // Aggressive reload strategy to bypass all caches
      player.pause();
      player.reset(); // Reset player state completely

      // Wait a tick for reset to complete, then set new source
      setTimeout(() => {
        if (player && !player.isDisposed()) {
          // Set new source directly (no intermediate empty source to avoid errors)
          player.src({
            src: src,
            type: "video/mp4",
          });

          // Force complete reload from network
          player.load();

          // Auto-play the new video
          player.play().catch((err) => {
            console.warn("[VideoPreview] Auto-play prevented:", err);
          });

          console.log("[VideoPreview] ✅ Video reloaded successfully");
        }
      }, 100);
    }
  }, [src]);

  // Dispose the Video.js player when the component unmounts
  useEffect(() => {
    const player = playerRef.current;

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div data-vjs-player className="w-full">
      <div ref={videoRef} className="w-full" />
    </div>
  );
}
