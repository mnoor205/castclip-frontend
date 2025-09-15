"use client";

import { useEffect } from 'react';
import {
  useClipEditorStore,
  TranscriptWord,
} from "@/stores/clip-editor-store";
import { VideoPreview } from "./video-preview";
import { TranscriptEditor } from './transcript-editor';
import { Button } from '@/components/ui/button';
import { Paintbrush } from 'lucide-react';

interface ClipEditorProps {
  videoUrl: string;
  initialTranscript: Array<{ word: string; start: number; end: number; }>;
  initialHook?: string;
  captionsStyle?: Record<string, any> | null;
  hookStyle?: Record<string, any> | null;
  projectStyle?: number | null;
  className?: string;
}

export function ClipEditor({ 
  videoUrl, 
  initialTranscript, 
  initialHook = "",
  captionsStyle,
  hookStyle,
  projectStyle,
  className = "",
}: ClipEditorProps) {
  const {
    setTranscript,
    setHook,
    isEditMode,
    setEditMode,
    initializeOriginalState,
    initializeStyles,
    resetState,
    setProjectStylePreference,
  } = useClipEditorStore();

  // Initialize editor with clip data
  useEffect(() => {
    try {
      // Reset state first to avoid state bleeding
      resetState();
      
      // Initialize styles first
      initializeStyles(hookStyle as any, captionsStyle as any, projectStyle ?? null);
      
      // Validate transcript data
      if (!Array.isArray(initialTranscript)) {
        return;
      }

      // Convert initial transcript to our format with IDs
      const transcriptWithIds: TranscriptWord[] = initialTranscript.map((word, index) => ({
        ...word,
        id: `word_${index}`
      }));
      
      setTranscript(transcriptWithIds);
      setHook(initialHook);
      if (typeof projectStyle === 'number') {
        setProjectStylePreference(projectStyle);
      }
      
      // Initialize original state for change tracking AFTER styles are set
      // We'll get the initialized styles from the store
      const initialStoreState = useClipEditorStore.getState();
      initializeOriginalState(
        transcriptWithIds, 
        initialHook,
        initialStoreState.hookStyle,
        initialStoreState.captionsStyle
      );
    } catch (error) {
      // Silently handle initialization errors
      return;
    }
  }, [
    initialTranscript, 
    initialHook, 
    captionsStyle, 
    hookStyle, 
    projectStyle, 
    setTranscript, 
    setHook, 
    initializeOriginalState, 
    initializeStyles,
    resetState, 
    setProjectStylePreference
  ]);

  return (
    <div className={`grid lg:grid-cols-2 gap-6 lg:gap-8 items-start ${className}`}>
      <div className="w-full lg:sticky lg:top-24 flex flex-col gap-4">
        <VideoPreview
          videoUrl={videoUrl}
          className="w-full max-w-[350px] mx-auto"
        />
        <Button
          onClick={() => setEditMode(!isEditMode)}
          variant={isEditMode ? "default" : "outline"}
          size="sm"
          className="w-full max-w-[350px] mx-auto gap-2"
        >
          <Paintbrush className="h-4 w-4" />
          {isEditMode ? "Exit Text Edit Mode" : "Edit Text on Video"}
        </Button>
      </div>
      <TranscriptEditor className="w-full" />
    </div>
  );
}

