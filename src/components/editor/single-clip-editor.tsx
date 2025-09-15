"use client";

import { useState, useMemo } from 'react';
import { ClipEditor } from './clip-editor';
import { Button } from '@/components/ui/button';
import { Save, Loader2 } from 'lucide-react';
import { useClipEditorStore } from '@/stores/clip-editor-store';
import { toast } from 'sonner';
import { getClipVideoUrl } from '@/lib/constants';
import type { Clip } from '@prisma/client';
import { useEffect } from 'react';
import { updateClip } from '@/actions/clips';

interface SingleClipEditorProps {
  clip: Clip;
  projectId: string;
  captionsStyle?: Record<string, any> | null;
  hookStyle?: Record<string, any> | null;
  projectStyle?: number | null;
}

export function SingleClipEditor({ clip, projectId, captionsStyle, hookStyle, projectStyle }: SingleClipEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { hasChanges, getChanges, markAsSaved, transcript, hook, hookStyle: storeHookStyle, captionsStyle: storeCaptionsStyle, originalState } = useClipEditorStore();

  // Memoize change detection with proper dependency on originalState
  const hasAnyChanges = useMemo(() => hasChanges(), [transcript, hook, storeHookStyle, storeCaptionsStyle, originalState]);

  // Warn on browser refresh/close
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasAnyChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasAnyChanges]);

  const handleSave = async () => {
    if (!hasAnyChanges) {
      toast.info('No changes to save');
      return;
    }

    setIsSaving(true);
    
    try {
      const changes = getChanges();
      
      const finalChanges = {
        clipId: clip.id,
        transcript: changes.transcript?.map(({ word, start, end }) => ({ word, start, end })),
        hook: changes.hook,
        hookStyle: changes.hookStyle,
        captionsStyle: changes.captionsStyle
      };

      const videoUrl = getClipVideoUrl(clip);
      if (!videoUrl) {
        throw new Error("Video URL is not available, cannot trigger render.");
      }

      const renderData = {
        projectCaptionStyle: projectStyle ?? 1,
        rawClipUrl: videoUrl
      };

      const result = await updateClip(finalChanges, renderData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to save and render clip');
      }

      markAsSaved();
      toast.success('Clip saved and sent for rendering!');
    } catch (error) {
      console.error('Error saving and rendering clip:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`Operation failed: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const videoUrl = getClipVideoUrl(clip);
  const initialTranscript = Array.isArray(clip.transcript) ? clip.transcript as any[] : [];

  // Safety check for video URL
  if (!videoUrl) {
    return (
      <div className="w-full flex flex-col gap-6 p-6 text-center">
        <div className="text-red-600">
          <h3 className="text-lg font-semibold">Video Not Available</h3>
          <p className="text-sm text-muted-foreground mt-2">
            The video file for this clip could not be loaded. Please check if the clip has been properly processed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-6">
       <div className="flex items-center justify-between gap-4">
        {/* Change indicator for better UX */}
        <div className="text-sm text-muted-foreground">
          {hasAnyChanges ? (
            <span className="flex items-center gap-2 text-orange-600">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              Unsaved changes
            </span>
          ) : (
            <span className="text-green-600">All changes saved</span>
          )}
        </div>
        
        <Button
          onClick={handleSave}
          disabled={isSaving || !hasAnyChanges}
          className="gap-2"
          aria-label={
            isSaving 
              ? "Saving changes..." 
              : hasAnyChanges 
                ? "Save your changes to the clip" 
                : "No changes to save"
          }
          title={
            isSaving 
              ? "Saving changes..." 
              : hasAnyChanges 
                ? "Save your changes to the clip" 
                : "Make some changes to enable saving"
          }
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          <span>
            {isSaving ? "Saving..." : hasAnyChanges ? "Save Changes" : "No Changes"}
          </span>
        </Button>
      </div>
      <ClipEditor
        videoUrl={videoUrl}
        initialTranscript={initialTranscript}
        initialHook={clip.hook || ""}
        captionsStyle={captionsStyle}
        hookStyle={hookStyle}
        projectStyle={projectStyle}
      />
    </div>
  );
}
