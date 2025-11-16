"use client";

import { useRef, useState, useEffect } from "react";
import { Volume2, VolumeX, Play } from "lucide-react";

export function VideoFeaturesPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Set initial muted state
    video.muted = false;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering video click
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="relative z-10 bg-muted/70 border border-border rounded-3xl w-[280px] h-[560px] sm:w-[250px] sm:h-[500px] md:w-[300px] md:h-[600px] overflow-hidden cursor-pointer">
      <video
        ref={videoRef}
        src="https://castclip.revolt-ai.com/app/examples/demo/clip_0.mp4"
        loop
        muted={isMuted}
        playsInline
        className="w-full h-full object-cover rounded-3xl"
        preload="metadata"
        onClick={handleVideoClick}
      />
      
      {/* Play Button Overlay - Shows when paused */}
      {!isPlaying && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 rounded-3xl cursor-pointer"
          onClick={handleVideoClick}
        >
          <div className="p-4 rounded-full bg-black/60 backdrop-blur-sm">
            <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white fill-white" />
          </div>
        </div>
      )}
      
      {/* Mute/Unmute Button */}
      <button
        onClick={handleMuteToggle}
        className="absolute bottom-4 right-4 z-20 p-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm transition-all"
        aria-label={isMuted ? "Unmute video" : "Mute video"}
      >
        {isMuted ? (
          <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        ) : (
          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        )}
      </button>
    </div>
  );
}

