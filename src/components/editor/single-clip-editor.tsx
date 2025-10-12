"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { ClipEditor } from './clip-editor';
import { Button } from '@/components/ui/button';
import { Save, CheckCircle2 } from 'lucide-react';
import { useClipEditorStore } from '@/stores/clip-editor-store';
import { toast } from 'sonner';
import { getClipVideoUrl, VIDEO_GENERATION } from '@/lib/constants';
import type { Clip } from '@prisma/client';
import { updateClip, checkClipStatus } from '@/actions/clips';
import { GenerationProgressModal } from './generation-progress-modal';
import type { TranscriptWord } from '@/lib/types';
import type { TextStyle } from '@/stores/clip-editor-store';

interface SingleClipEditorProps {
  clip: Clip;
  projectId: string;
  captionsStyle?: TextStyle | null;
  hookStyle?: TextStyle | null;
  projectStyle?: number | null;
}

export function SingleClipEditor({ clip, captionsStyle, hookStyle, projectStyle }: SingleClipEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [generationState, setGenerationState] = useState<{
    status: 'idle' | 'processing' | 'completed' | 'failed';
    progress: number;
    renderedVideoUrl?: string | null;
    error?: string;
  }>({
    status: 'idle',
    progress: 0,
    renderedVideoUrl: null,
  });
  
  const { hasChanges, getChanges, markAsSaved, transcript, hook, hookStyle: storeHookStyle, captionsStyle: storeCaptionsStyle, captionStyleId } = useClipEditorStore();

  // Memoize change detection with proper dependency on originalState
  const hasAnyChanges = useMemo(() => hasChanges(), [hasChanges]);

  // Poll for generation status with smooth continuous progress
  const pollClipStatus = useCallback(async () => {
    let attempts = 0;
    const maxAttempts = 60;
    const startTime = Date.now();

    const poll = async () => {
      try {
        const elapsed = (Date.now() - startTime) / 1000;
        
        // Move smoothly to 85% in first 30 seconds
        if (elapsed < 30) {
          const targetProgress = Math.min(85, 5 + (elapsed / 30) * 80);
          setGenerationState(prev => ({
            ...prev,
            progress: targetProgress
          }));
          setTimeout(poll, 300); // Update every 300ms for smooth movement
          return;
        }
        
        // After 30 seconds, start checking for actual completion
        const status = await checkClipStatus(clip.id);
        
        if (status.isRendered) {
          // Rush to completion - animate from current to 100% quickly
          setGenerationState(prev => {
            const currentProgress = prev.progress;
            const rushDuration = 800; // 0.8 seconds to complete
            
            const startProgress = currentProgress;
            const startRushTime = Date.now();
            
            const rush = () => {
              const elapsed = Date.now() - startRushTime;
              const progressRatio = Math.min(elapsed / rushDuration, 1);
              const progress = startProgress + (100 - startProgress) * progressRatio;
              
              setGenerationState(current => ({
                ...current,
                progress
              }));
              
              if (progressRatio < 1) {
                requestAnimationFrame(rush);
              } else {
                // Set final completed state
                setGenerationState({
                  status: 'completed',
                  progress: 100,
                  renderedVideoUrl: status.renderedClipUrl,
                });
              }
            };
            
            requestAnimationFrame(rush);
            return prev;
          });
          return;
        }

        attempts++;
        
        // Slowly creep between 85-92% while waiting
        const waitingProgress = Math.min(92, 85 + attempts * 0.3);
        setGenerationState(prev => ({ ...prev, progress: waitingProgress }));

        if (attempts >= maxAttempts) {
          setGenerationState(prev => ({
            ...prev,
            status: 'failed',
            error: 'Generation is taking longer than expected. Please check back later.'
          }));
          return;
        }

        // Poll every 2 seconds while waiting for completion
        setTimeout(poll, 2000);
        
      } catch (error) {
        console.error('Error polling clip status:', error);
        setGenerationState({
          status: 'failed',
          progress: 0,
          error: 'Failed to check generation status. Please try again.',
        });
      }
    };

    poll();
  }, [clip.id]);

  // Warn on browser refresh/close
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasAnyChanges || generationState.status === 'processing') {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasAnyChanges, generationState.status]);

  const handleSave = async () => {
    if (!hasAnyChanges) {
      toast.info('No changes to save');
      return;
    }

    // Open modal immediately and start progress animation
    setModalOpen(true);
    setGenerationState({
      status: 'processing',
      progress: 5, // Start at 5% immediately
      renderedVideoUrl: null,
    });
    setIsSaving(true);
    
    // Start polling immediately so progress starts moving
    pollClipStatus();
    
    try {
      const changes = getChanges();
      
      const finalChanges = {
        clipId: clip.id,
        transcript: changes.transcript?.map(({ word, start, end }) => ({ word, start, end })),
        hook: changes.hook,
        hookStyle: changes.hookStyle,
        captionsStyle: changes.captionsStyle,
        captionStyleId: changes.captionStyleId,
      };

      const videoUrl = getClipVideoUrl(clip);
      if (!videoUrl) {
        throw new Error("Video URL is not available, cannot trigger render.");
      }

      // Construct the payload for rendering (excluding clipId)
      const renderData = {
        rawClipUrl: videoUrl,
        transcript: transcript.map(({ word, start, end }) => ({ word, start, end })),
        hook: hook,
        hookStyle: storeHookStyle,
        captionsStyle: storeCaptionsStyle,
        captionStyleId: captionStyleId,
        projectCaptionStyle: projectStyle ?? 1,
      };

      const result = await updateClip(finalChanges, renderData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to save and render clip');
      }

      markAsSaved();
      setIsSaving(false);
    } catch (error) {
      console.error('Error saving and rendering clip:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(`Operation failed: ${errorMessage}`);
      setIsSaving(false);
      setGenerationState({
        status: 'failed',
        progress: 0,
        error: errorMessage,
      });
    }
  };
  
  const videoUrl = getClipVideoUrl(clip);
  const initialTranscript = Array.isArray(clip.transcript) ? (clip.transcript as TranscriptWord[]) : [];

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
    <>
      <div className="w-full flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          {/* Change indicator for better UX */}
          <div className="text-sm text-muted-foreground">
            {generationState.status === 'processing' ? (
              <span className="text-blue-600">
                Generating video...
              </span>
            ) : hasAnyChanges ? (
              <span className="flex items-center gap-2 text-orange-600">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                Unsaved changes
              </span>
            ) : (
              <span className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                All changes saved
              </span>
            )}
          </div>
          
          <Button
            onClick={handleSave}
            disabled={isSaving || generationState.status === 'processing' || !hasAnyChanges}
            className="gap-2"
            aria-label={
              isSaving 
                ? "Saving changes..." 
                : generationState.status === 'processing'
                  ? "Generating video..."
                  : hasAnyChanges 
                    ? "Save your changes to the clip" 
                    : "No changes to save"
            }
            title={
              isSaving 
                ? "Saving changes..." 
                : generationState.status === 'processing'
                  ? "Video is being generated..."
                  : hasAnyChanges 
                    ? "Save your changes to the clip" 
                    : "Make some changes to enable saving"
            }
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            <span>
              {isSaving ? "Saving..." : generationState.status === 'processing' ? "Generating..." : hasAnyChanges ? "Save Changes" : "No Changes"}
            </span>
          </Button>
        </div>
        
        <ClipEditor
          videoUrl={videoUrl}
          initialTranscript={initialTranscript}
          initialHook={clip.hook || ""}
          captionsStyle={captionsStyle}
          hookStyle={hookStyle}
          projectStyle={projectStyle ?? VIDEO_GENERATION.DEFAULT_CAPTION_STYLE}
        />
      </div>

      {/* Generation Progress Modal */}
      <GenerationProgressModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        clipId={clip.id}
        progress={generationState.progress}
        status={generationState.status}
        renderedVideoUrl={generationState.renderedVideoUrl}
        error={generationState.error}
      />
    </>
  );
}
