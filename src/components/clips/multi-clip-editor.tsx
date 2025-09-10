"use client";

import { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import { ClipEditor } from './clip-editor';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useClipEditorStore } from '@/stores/clip-editor-store';
import { toast } from 'sonner';
import { 
  Save, 
  RotateCcw, 
  Download, 
  AlertCircle, 
  CheckCircle2,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Clip } from '@prisma/client';

export interface MultiClipEditorRef {
  saveAll: () => Promise<void>;
}

interface MultiClipEditorProps {
  projectId: string;
  clips: Clip[];
  projectTitle: string;
  captionStyle: number;
  onSaveAll?: (changes: ClipEditState[], textPositioning: any) => Promise<void>;
}

interface ClipEditState {
  clipId: string;
  transcript: any[];
  hook: string;
  hookStyle?: any;
  captionsStyle?: any;
  hasChanges: boolean;
  isSaving: boolean;
}

export const MultiClipEditor = forwardRef<MultiClipEditorRef, MultiClipEditorProps>(function MultiClipEditor({ projectId, clips, projectTitle, captionStyle, onSaveAll }, ref) {
  const router = useRouter();
  const [activeClipId, setActiveClipId] = useState<string>(clips[0]?.id || '');
  const [clipStates, setClipStates] = useState<Record<string, ClipEditState>>({});
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

  const { transcript, hook, hookStyle, captionsStyle, setCaptionStylePreference } = useClipEditorStore();

  // Set the caption style preference once
  useEffect(() => {
    if (setCaptionStylePreference) {
      setCaptionStylePreference(captionStyle);
    }
  }, [captionStyle, setCaptionStylePreference]);

  // Initialize clip states
  useEffect(() => {
    const initialStates: Record<string, ClipEditState> = {};
    
    // Default text styles - these are the "original" values to compare against
    const defaultHookStyle = {
      fontSize: 24,
      position: { x: 50, y: 15 }
    };
    const defaultCaptionsStyle = {
      fontSize: 32,
      position: { x: 50, y: 80 }
    };
    
    clips.forEach(clip => {
      initialStates[clip.id] = {
        clipId: clip.id,
        transcript: Array.isArray(clip.transcript) ? clip.transcript as any[] : [],
        hook: clip.hook || '',
        hookStyle: defaultHookStyle, // Use default, not current global state
        captionsStyle: defaultCaptionsStyle, // Use default, not current global state
        hasChanges: false,
        isSaving: false
      };
    });
    
    console.log('Initialized clip states:', initialStates);
    setClipStates(initialStates);
  }, [clips]);

  // Update clip state when editor changes
  useEffect(() => {
    if (activeClipId && clipStates[activeClipId]) {
      const currentState = clipStates[activeClipId];
      const hasTranscriptChanged = JSON.stringify(transcript) !== JSON.stringify(currentState.transcript);
      const hasHookChanged = hook !== currentState.hook;
      const hasHookStyleChanged = JSON.stringify(hookStyle) !== JSON.stringify(currentState.hookStyle);
      const hasCaptionsStyleChanged = JSON.stringify(captionsStyle) !== JSON.stringify(currentState.captionsStyle);
      const hasChanges = hasTranscriptChanged || hasHookChanged || hasHookStyleChanged || hasCaptionsStyleChanged;

      // Debug logging
      console.log('=== CHANGE DETECTION DEBUG ===');
      console.log('Active clip:', activeClipId);
      console.log('Transcript changed:', hasTranscriptChanged);
      console.log('Hook changed:', hasHookChanged);
      console.log('Hook style changed:', hasHookStyleChanged);
      console.log('Captions style changed:', hasCaptionsStyleChanged);
      console.log('Overall hasChanges:', hasChanges);
      console.log('Current state hasChanges:', currentState.hasChanges);
      console.log('==============================');

      if (hasChanges || currentState.hasChanges !== hasChanges) {
        console.log('Updating clip state for:', activeClipId, 'hasChanges:', hasChanges);
        setClipStates(prev => ({
          ...prev,
          [activeClipId]: {
            ...prev[activeClipId],
            transcript: [...transcript],
            hook,
            hookStyle: { ...hookStyle },
            captionsStyle: { ...captionsStyle },
            hasChanges
          }
        }));
      }
    }
  }, [transcript, hook, hookStyle, captionsStyle, activeClipId]);

  // Get active clip data
  const activeClip = clips.find(clip => clip.id === activeClipId);
  const activeState = clipStates[activeClipId];

  // Get video URL for active clip
  const getVideoUrl = useCallback((clip: Clip) => {
    return clip.rawClipUrl || 
           (clip.s3Key?.startsWith('http') ? clip.s3Key : `https://castclip.revolt-ai.com/${clip.s3Key}`);
  }, []);

  // Save individual clip
  const saveClip = useCallback(async (clipId: string) => {
    const state = clipStates[clipId];
    if (!state || !state.hasChanges) return;

    setClipStates(prev => ({
      ...prev,
      [clipId]: { ...prev[clipId], isSaving: true }
    }));

    try {
      const response = await fetch(`/api/clips/${clipId}/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: state.transcript,
          hook: state.hook
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save clip');
      }

      setClipStates(prev => ({
        ...prev,
        [clipId]: { 
          ...prev[clipId], 
          hasChanges: false, 
          isSaving: false 
        }
      }));

      toast.success('Clip saved successfully');
    } catch (error) {
      console.error('Error saving clip:', error);
      toast.error('Failed to save clip');
      setClipStates(prev => ({
        ...prev,
        [clipId]: { ...prev[clipId], isSaving: false }
      }));
    }
  }, [clipStates]);

  // Save all clips with changes
  const saveAllClips = useCallback(async () => {
    const clipsToSave = Object.values(clipStates).filter(state => state.hasChanges);
    
    console.log('=== SAVE ATTEMPT ===');
    console.log('Total clips:', Object.values(clipStates).length);
    console.log('Clips with changes:', clipsToSave.length);
    console.log('All clip states:', clipStates);
    console.log('===================');
    
    if (clipsToSave.length === 0) {
      console.log('No changes detected - showing toast');
      toast.info('No changes to save');
      return;
    }

    setIsBatchSaving(true);

    try {
      if (onSaveAll) {
        // Use custom save callback (for logging changes)
        const textPositioning = {
          hookStyle,
          captionsStyle
        };
        
        console.log('=== SAVE ALL CHANGES ===');
        console.log('Clips to save:', clipsToSave.length);
        clipsToSave.forEach((state, index) => {
          console.log(`Clip ${index + 1} (${state.clipId}):`, {
            transcript: state.transcript,
            hook: state.hook,
            hookStyle: state.hookStyle,
            captionsStyle: state.captionsStyle
          });
        });
        console.log('Global text positioning:', textPositioning);
        console.log('========================');
        
        await onSaveAll(clipsToSave, textPositioning);
        
        // Mark all clips as saved
        setClipStates(prev => {
          const updated = { ...prev };
          clipsToSave.forEach(state => {
            updated[state.clipId] = {
              ...updated[state.clipId],
              hasChanges: false,
              isSaving: false
            };
          });
          return updated;
        });

        setLastSaveTime(new Date());
        toast.success(`Saved ${clipsToSave.length} clip${clipsToSave.length !== 1 ? 's' : ''} successfully`);
      } else {
        // Use existing API save logic
        const savePromises = clipsToSave.map(state =>
          fetch(`/api/clips/${state.clipId}/edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transcript: state.transcript,
              hook: state.hook,
              hookStyle: state.hookStyle,
              captionsStyle: state.captionsStyle
            })
          })
        );

        const results = await Promise.allSettled(savePromises);
        const failures = results.filter(result => result.status === 'rejected').length;

        if (failures === 0) {
          // Mark all clips as saved
          setClipStates(prev => {
            const updated = { ...prev };
            clipsToSave.forEach(state => {
              updated[state.clipId] = {
                ...updated[state.clipId],
                hasChanges: false,
                isSaving: false
              };
            });
            return updated;
          });

          setLastSaveTime(new Date());
          toast.success(`Saved ${clipsToSave.length} clip${clipsToSave.length !== 1 ? 's' : ''} successfully`);
        } else {
          toast.error(`Failed to save ${failures} clip${failures !== 1 ? 's' : ''}`);
        }
      }
    } catch (error) {
      console.error('Error batch saving:', error);
      toast.error('Failed to save clips');
    } finally {
      setIsBatchSaving(false);
    }
  }, [clipStates, onSaveAll, hookStyle, captionsStyle]);

  // Reset clip to original state
  const resetClip = useCallback((clipId: string) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;

    // Use the same default values as initialization
    const defaultHookStyle = {
      fontSize: 24,
      position: { x: 50, y: 15 }
    };
    const defaultCaptionsStyle = {
      fontSize: 32,
      position: { x: 50, y: 80 }
    };

    setClipStates(prev => ({
      ...prev,
      [clipId]: {
        ...prev[clipId],
        transcript: Array.isArray(clip.transcript) ? clip.transcript as any[] : [],
        hook: clip.hook || '',
        hookStyle: defaultHookStyle,
        captionsStyle: defaultCaptionsStyle,
        hasChanges: false
      }
    }));

    toast.info('Clip reset to original state');
  }, [clips]);

  // Count clips with changes
  const clipsWithChanges = Object.values(clipStates).filter(state => state.hasChanges).length;

  // Expose save function through ref
  useImperativeHandle(ref, () => ({
    saveAll: saveAllClips
  }));

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (clipsWithChanges > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const handleRouteChange = () => {
      if (clipsWithChanges > 0) {
        const confirmed = window.confirm(
          `You have ${clipsWithChanges} unsaved clip${clipsWithChanges !== 1 ? 's' : ''}. Are you sure you want to leave?`
        );
        if (!confirmed) {
          return false;
        }
      }
      return true;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [clipsWithChanges]);

  if (!activeClip || !activeState) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No clips available for editing or loading...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Tabbed interface for clips */}
      <Tabs value={activeClipId} onValueChange={setActiveClipId} className="w-full">
        <TabsList className="w-full h-auto p-2 bg-muted/50">
          <div className="w-full overflow-x-auto scrollbar-hide">
            <div className="flex gap-1 min-w-max pb-1">
              {clips.map((clip, index) => {
                const state = clipStates[clip.id];
                const hasChanges = state?.hasChanges || false;
                const isSaving = state?.isSaving || false;
                
                return (
                  <TabsTrigger
                    key={clip.id}
                    value={clip.id}
                    className="relative flex items-center gap-2 px-3 py-2 whitespace-nowrap"
                  >
                    <span>Clip {index + 1}</span>
                    {hasChanges && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    )}
                    {isSaving && (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                  </TabsTrigger>
                );
              })}
            </div>
          </div>
        </TabsList>

        {clips.map((clip) => (
          <TabsContent key={clip.id} value={clip.id} className="mt-6">
            <ClipEditor
              videoUrl={getVideoUrl(clip)}
              initialTranscript={Array.isArray(clip.transcript) ? clip.transcript as any[] : []}
              initialHook={clip.hook || ''}
              className="w-full"
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
});
