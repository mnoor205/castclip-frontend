"use client";

import { useEffect } from 'react';
import {
  useClipEditorStore,
  TranscriptWord,
} from "@/stores/clip-editor-store";
import { VideoPreview } from "./video-preview";
import { TranscriptEditor } from './transcript-editor';
import { CaptionStyleSelector } from './caption-style-selector';
import { VIDEO_GENERATION } from '@/lib/constants';
import type { TextStyle } from '@/stores/clip-editor-store';

interface ClipEditorProps {
  videoUrl: string;
  initialTranscript: Array<{ word: string; start: number; end: number; }>;
  initialHook?: string;
  captionsStyle?: TextStyle | null;
  hookStyle?: TextStyle | null;
  projectStyle: number;
  className?: string;
}

export function ClipEditor({ 
  videoUrl, 
  initialTranscript, 
  initialHook = "",
  captionsStyle,
  hookStyle,
  projectStyle = VIDEO_GENERATION.DEFAULT_CAPTION_STYLE,
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
  const setSelectedTextElement = useClipEditorStore((state) => state.setSelectedTextElement);

  // Initialize editor with clip data
  useEffect(() => {
    try {
      // Reset state first to avoid state bleeding
      resetState();
      
      // Initialize styles first
      initializeStyles(hookStyle ?? null, captionsStyle ?? null, projectStyle);
      
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
      setCaptionStyleId(projectStyle);
      
      // Initialize original state for change tracking AFTER styles are set
      // We'll get the initialized styles from the store
      const initialStoreState = useClipEditorStore.getState();
      initializeOriginalState(
        transcriptWithIds, 
        initialHook,
        initialStoreState.hookStyle,
        initialStoreState.captionsStyle,
        initialStoreState.captionStyleId
      );
    } catch {
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

  const handleContainerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // If the click is on a drag handle or an editable box, do nothing
    if (target.closest('[data-overlay-element]')) {
      return;
    }
    // Otherwise, deselect
    setSelectedTextElement(null);
  };

  return (
    <div
      className={`grid lg:grid-cols-2 gap-6 lg:gap-8 items-start ${className}`}
      onPointerDown={handleContainerPointerDown}
    >
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

