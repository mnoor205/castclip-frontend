"use client";

import { useEffect } from 'react';
import { useClipEditorStore } from '@/stores/clip-editor-store';
import { VideoPreview } from './video-preview';
import { TranscriptEditor } from './transcript-editor';
import type { TranscriptWord } from '@/stores/clip-editor-store';

interface ClipEditorProps {
  videoUrl: string;
  initialTranscript: Array<{ word: string; start: number; end: number; }>;
  initialHook?: string;
  className?: string;
}

export function ClipEditor({ 
  videoUrl, 
  initialTranscript, 
  initialHook = "",
  className = ""
}: ClipEditorProps) {
  const { setTranscript, setHook } = useClipEditorStore();

  // Initialize editor with clip data
  useEffect(() => {
    // Convert initial transcript to our format with IDs
    const transcriptWithIds: TranscriptWord[] = initialTranscript.map((word, index) => ({
      ...word,
      id: `word_${index}_${Date.now()}`
    }));
    
    setTranscript(transcriptWithIds);
    setHook(initialHook);
  }, [initialTranscript, initialHook, setTranscript, setHook]);

  return (
    <div className={`w-full ${className}`}>
      {/* Mobile-first responsive layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Video Preview */}
        <div className="lg:w-1/2">
          <div className="sticky top-4">
            <VideoPreview 
              videoUrl={videoUrl}
              className="w-full max-w-[350px] mx-auto"
            />
          </div>
        </div>
        
        {/* Transcript Editor */}
        <div className="lg:w-1/2">
          <TranscriptEditor className="w-full" />
        </div>
      </div>
    </div>
  );
}

