"use client";

import { useState, useCallback, useEffect } from 'react';
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

interface MultiClipEditorProps {
  projectId: string;
  clips: Clip[];
  projectTitle: string;
}

interface ClipEditState {
  clipId: string;
  transcript: any[];
  hook: string;
  hasChanges: boolean;
  isSaving: boolean;
}

export function MultiClipEditor({ projectId, clips, projectTitle }: MultiClipEditorProps) {
  const router = useRouter();
  const [activeClipId, setActiveClipId] = useState<string>(clips[0]?.id || '');
  const [clipStates, setClipStates] = useState<Record<string, ClipEditState>>({});
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

  const { transcript, hook } = useClipEditorStore();

  // Initialize clip states
  useEffect(() => {
    const initialStates: Record<string, ClipEditState> = {};
    clips.forEach(clip => {
      initialStates[clip.id] = {
        clipId: clip.id,
        transcript: Array.isArray(clip.transcript) ? clip.transcript : [],
        hook: clip.hook || '',
        hasChanges: false,
        isSaving: false
      };
    });
    setClipStates(initialStates);
  }, [clips]);

  // Update clip state when editor changes
  useEffect(() => {
    if (activeClipId && clipStates[activeClipId]) {
      const currentState = clipStates[activeClipId];
      const hasTranscriptChanged = JSON.stringify(transcript) !== JSON.stringify(currentState.transcript);
      const hasHookChanged = hook !== currentState.hook;
      const hasChanges = hasTranscriptChanged || hasHookChanged;

      if (hasChanges || currentState.hasChanges !== hasChanges) {
        setClipStates(prev => ({
          ...prev,
          [activeClipId]: {
            ...prev[activeClipId],
            transcript: [...transcript],
            hook,
            hasChanges
          }
        }));
      }
    }
  }, [transcript, hook, activeClipId, clipStates]);

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
    
    if (clipsToSave.length === 0) {
      toast.info('No changes to save');
      return;
    }

    setIsBatchSaving(true);

    try {
      const savePromises = clipsToSave.map(state =>
        fetch(`/api/clips/${state.clipId}/edit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript: state.transcript,
            hook: state.hook
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
    } catch (error) {
      console.error('Error batch saving:', error);
      toast.error('Failed to save clips');
    } finally {
      setIsBatchSaving(false);
    }
  }, [clipStates]);

  // Reset clip to original state
  const resetClip = useCallback((clipId: string) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;

    setClipStates(prev => ({
      ...prev,
      [clipId]: {
        ...prev[clipId],
        transcript: Array.isArray(clip.transcript) ? clip.transcript : [],
        hook: clip.hook || '',
        hasChanges: false
      }
    }));

    toast.info('Clip reset to original state');
  }, [clips]);

  // Count clips with changes
  const clipsWithChanges = Object.values(clipStates).filter(state => state.hasChanges).length;

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
      {/* Header with batch actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Editing {clips.length} Clips</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Make changes to captions and hooks, then save when ready
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {clipsWithChanges > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {clipsWithChanges} unsaved
                </Badge>
              )}
              
              {lastSaveTime && (
                <Badge variant="outline" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Saved {lastSaveTime.toLocaleTimeString()}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={saveAllClips}
              disabled={clipsWithChanges === 0 || isBatchSaving}
              className="gap-2"
            >
              {isBatchSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save All Changes {clipsWithChanges > 0 && `(${clipsWithChanges})`}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => resetClip(activeClipId)}
              disabled={!activeState.hasChanges}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Current
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open(`/projects/${projectId}`, '_blank')}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View Project
            </Button>
          </div>
        </CardContent>
      </Card>

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
              initialTranscript={Array.isArray(clip.transcript) ? clip.transcript : []}
              initialHook={clip.hook || ''}
              className="w-full"
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick actions footer */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium">Quick Actions</h3>
              <p className="text-sm text-muted-foreground">
                After editing, you can export your clips with the new captions
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => saveClip(activeClipId)}
                disabled={!activeState.hasChanges || activeState.isSaving}
                size="sm"
                className="gap-2"
              >
                {activeState.isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Current
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  // Future: Export functionality
                  toast.info('Export functionality coming soon!');
                }}
              >
                <Download className="h-4 w-4" />
                Export All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
