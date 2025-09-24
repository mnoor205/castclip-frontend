"use client";

import { useEffect } from 'react';
import {
  useClipEditorStore,
  TranscriptWord,
} from "@/stores/clip-editor-store";
import { VideoPreview } from "./video-preview";
import { TranscriptEditor } from './transcript-editor';
import { CaptionStyleSelector } from './caption-style-selector';

interface ClipEditorProps {
  videoUrl: string;
  initialTranscript: Array<{ word: string; start: number; end: number; }>;
  initialHook?: string;
  captionsStyle?: Record<string, any> | null;
  hookStyle?: Record<string, any> | null;
  projectStyle: number | null;
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
  // Select state and actions individually to prevent re-render loops
  const setTranscript = useClipEditorStore((state) => state.setTranscript);
  const setHook = useClipEditorStore((state) => state.setHook);
  const initializeOriginalState = useClipEditorStore((state) => state.initializeOriginalState);
  const initializeStyles = useClipEditorStore((state) => state.initializeStyles);
  const resetState = useClipEditorStore((state) => state.resetState);
  const setCaptionStyleId = useClipEditorStore((state) => state.setCaptionStyleId);
  const captionStyleId = useClipEditorStore((state) => state.captionStyleId);

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
        setCaptionStyleId(projectStyle);
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
    setCaptionStyleId
  ]);

  return (
    <div className={`grid lg:grid-cols-2 gap-6 lg:gap-8 items-start ${className}`}>
      <div className="w-full lg:sticky lg:top-24 flex flex-col gap-4 max-w-[370px] mx-auto">
        <VideoPreview videoUrl={videoUrl} transcript={initialTranscript}/>
      </div>
      <div className="flex flex-col gap-8">
        <TranscriptEditor />
        <CaptionStyleSelector
          selectedStyleId={captionStyleId}
          onStyleChange={setCaptionStyleId}
        />
      </div>
    </div>
  );
}

