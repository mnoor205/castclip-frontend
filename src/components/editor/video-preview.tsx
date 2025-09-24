"use client";

import { Player } from "@remotion/player";
import { RemotionComposition } from "../../../remotion/composition";
import { useEffect, useState } from "react";
import { parseMedia } from '@remotion/media-parser';
import { Skeleton } from "../ui/skeleton";
import { TranscriptWord, VideoMetadata } from "@/lib/types";
import DragOverlay from "./drag-overlay";
import { useClipEditorStore } from "@/stores/clip-editor-store";
import { CLIP_CONFIG, VIDEO_GENERATION } from "@/lib/constants";
import { TextStyle } from "@/stores/clip-editor-store";

interface ClipRenderData {
  transcript?: TranscriptWord[];
  hook?: string;
  hookStyle?: TextStyle | null;
  captionsStyle?: TextStyle | null;
  captionStylePreference?: number | null;
}

interface VideoPreviewProps {
  videoUrl: string;
  transcript?: TranscriptWord[];
  className?: string;
  displayOnly?: boolean;
  clip?: ClipRenderData;
}

export function VideoPreview({ videoUrl, transcript = [], className, displayOnly = false, clip }: VideoPreviewProps) {
  // State to hold the parsed metadata, typed correctly.
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const storeTranscript = useClipEditorStore((state) => state.transcript);
  const storeHook = useClipEditorStore((state) => state.hook);
  const storeHookStyle = useClipEditorStore((state) => state.hookStyle);
  const storeCaptionsStyle = useClipEditorStore((state) => state.captionsStyle);
  const storeCaptionStyleId = useClipEditorStore((state) => state.captionStyleId);

  const setDuration = useClipEditorStore((state) => state.setDuration);

  useEffect(() => {
    const fetchMetadata = async () => {
      // Reset state when URL changes to show loading skeleton
      setMetadata(null); 
      try {
        const data = await parseMedia({
          src: videoUrl,
          fields: {
            durationInSeconds: true,
            dimensions: true,
            fps: true,
          }
        });
        setMetadata(data as VideoMetadata);
      } catch (error) {
        console.error("Failed to parse video metadata:", error);
      }
    };

    fetchMetadata();
  }, [videoUrl]);

  useEffect(() => {
    if (!metadata || displayOnly) return;
    if (metadata.durationInSeconds) {
      setDuration(metadata.durationInSeconds);
    }
  }, [metadata, setDuration, displayOnly]);

  const { durationInSeconds, dimensions, fps } = metadata ?? {};
  const { width, height } = dimensions ?? {};

  if (durationInSeconds === undefined || durationInSeconds === null || !width || !height || !fps) {
    return (
      <div
        className={`relative aspect-[9/16] bg-black rounded-lg overflow-hidden ${className}`}
      >
        <Skeleton className="w-full h-full" />
      </div>
    );
  }

  const durationInFrames = Math.floor(durationInSeconds * fps);

  const resolvedTranscript =
    (clip?.transcript && clip.transcript.length > 0)
      ? clip.transcript
      : (storeTranscript.length > 0)
        ? storeTranscript
        : (transcript ?? []);

  const resolvedHook = clip?.hook ?? storeHook ?? "";
  const resolvedHookStyle = clip?.hookStyle ?? storeHookStyle ?? CLIP_CONFIG.DEFAULT_HOOK_STYLE;
  const resolvedCaptionsStyle = clip?.captionsStyle ?? storeCaptionsStyle ?? CLIP_CONFIG.DEFAULT_CAPTIONS_STYLE;
  const resolvedCaptionStyleId = storeCaptionStyleId ?? clip?.captionStylePreference ?? VIDEO_GENERATION.DEFAULT_CAPTION_STYLE;

  return (
    <div
      className={`relative aspect-[9/16] bg-black rounded-lg overflow-hidden ${className}`}
    >
      <Player 
      component={RemotionComposition}
        inputProps={{
          videoUrl,
          transcript: resolvedTranscript,
          hook: resolvedHook,
          hookStyle: resolvedHookStyle,
          captionsStyle: resolvedCaptionsStyle,
          captionStyleId: resolvedCaptionStyleId,
        }}
        durationInFrames={durationInFrames}
        compositionWidth={width}
        compositionHeight={height}
        fps={fps}
        controls
        style={{
          height: "100%",
          width: "100%",
        }}
      />
      {!displayOnly && (
        <DragOverlay
          transcript={resolvedTranscript}
          hook={resolvedHook}
          hookStyle={resolvedHookStyle}
          captionsStyle={resolvedCaptionsStyle}
        />
      )}
    </div>
  );
}
