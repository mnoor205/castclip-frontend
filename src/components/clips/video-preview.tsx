"use client";

import { useRef, useEffect, useCallback } from 'react';
import { useClipEditorStore } from '@/stores/clip-editor-store';

interface VideoPreviewProps {
  videoUrl: string;
  className?: string;
}

export function VideoPreview({ videoUrl, className = "" }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const {
    currentTime,
    isPlaying,
    duration,
    transcript,
    hook,
    setCurrentTime,
    setIsPlaying,
    setDuration,
    getActiveWords
  } = useClipEditorStore();

  // Video event handlers
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, [setCurrentTime]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, [setDuration]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, [setIsPlaying]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, [setIsPlaying]);

  // Canvas drawing function
  const drawSubtitles = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size to match video display size
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Draw hook (always visible at top)
    if (hook.trim()) {
      ctx.font = 'bold 24px Impact, Arial, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      
      const hookY = canvas.height * 0.15; // 15% from top
      ctx.strokeText(hook, canvas.width / 2, hookY);
      ctx.fillText(hook, canvas.width / 2, hookY);
    }

    // Draw active words
    const activeWords = getActiveWords();
    if (activeWords.length > 0) {
      ctx.font = 'bold 32px Impact, Arial, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.textAlign = 'center';
      
      // Combine active words into phrases
      const text = activeWords.map(w => w.word).join(' ');
      
      // Position text at bottom third
      const textY = canvas.height * 0.75; // 75% from top
      
      // Handle text wrapping for long phrases
      const maxWidth = canvas.width * 0.9;
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width <= maxWidth || currentLine === '') {
          currentLine = testLine;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }

      // Draw each line
      lines.forEach((line, index) => {
        const y = textY + (index * 40); // 40px line height
        ctx.strokeText(line, canvas.width / 2, y);
        ctx.fillText(line, canvas.width / 2, y);
      });
    }
  }, [hook, getActiveWords]);

  // Animation loop for smooth rendering
  const animate = useCallback(() => {
    drawSubtitles();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [drawSubtitles]);

  // Start animation loop
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  // Handle window resize to update canvas size
  useEffect(() => {
    const handleResize = () => {
      drawSubtitles();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawSubtitles]);

  return (
    <div className={`relative aspect-[9/16] bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Video element */}
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-cover"
        controls
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
      />
      
      {/* Canvas overlay for subtitles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ 
          width: '100%', 
          height: '100%',
          objectFit: 'cover'
        }}
      />
      
      {/* Debug info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs p-2 rounded">
          <div>Time: {currentTime.toFixed(2)}s</div>
          <div>Duration: {duration.toFixed(2)}s</div>
          <div>Active words: {getActiveWords().length}</div>
        </div>
      )}
    </div>
  );
}

