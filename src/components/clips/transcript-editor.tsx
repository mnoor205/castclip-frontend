"use client";

import { useCallback, useState } from 'react';
import { useClipEditorStore } from '@/stores/clip-editor-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface TranscriptEditorProps {
  className?: string;
}

export function TranscriptEditor({ className = "" }: TranscriptEditorProps) {
  const {
    transcript,
    hook,
    currentTime,
    isPlaying,
    updateWord,
    setHook,
    getActiveWords
  } = useClipEditorStore();

  const [editingWordIndex, setEditingWordIndex] = useState<number | null>(null);

  // Format time for display
  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toFixed(1).padStart(4, '0')}`;
  }, []);

  // Handle word editing
  const handleWordEdit = useCallback((index: number, newText: string) => {
    updateWord(index, newText);
  }, [updateWord]);

  // Handle word click for editing
  const handleWordClick = useCallback((index: number) => {
    setEditingWordIndex(editingWordIndex === index ? null : index);
  }, [editingWordIndex]);

  // Check if word is currently active (being spoken)
  const isWordActive = useCallback((word: any) => {
    return currentTime >= word.start && currentTime <= word.end;
  }, [currentTime]);

  // Get word styling based on state
  const getWordStyling = useCallback((word: any, index: number) => {
    const isActive = isWordActive(word);
    const isEditing = editingWordIndex === index;
    
    let classes = "inline-block px-1 py-0.5 m-0.5 rounded text-sm cursor-pointer transition-all border ";
    
    if (isActive) {
      classes += "bg-blue-500 text-white border-blue-600 shadow-lg ";
    } else if (isEditing) {
      classes += "bg-yellow-100 text-yellow-900 border-yellow-300 ";
    } else {
      classes += "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 ";
    }
    
    return classes;
  }, [isWordActive, editingWordIndex]);

  return (
    <div className={`flex flex-col gap-6 p-4 bg-white rounded-lg border ${className}`}>
      {/* Hook Editor */}
      <div className="space-y-2">
        <Label htmlFor="hook-input" className="text-sm font-medium">
          Hook Text (Always Visible)
        </Label>
        <Textarea
          id="hook-input"
          value={hook}
          onChange={(e) => setHook(e.target.value)}
          placeholder="Enter an attention-grabbing hook..."
          className="min-h-[60px] resize-none"
          rows={2}
        />
        <p className="text-xs text-gray-500">
          This text will appear at the top of the video throughout the entire clip.
        </p>
      </div>

      {/* Current Time Display */}
      <div className="flex items-center gap-2 text-sm">
        <Badge variant="outline" className="font-mono">
          {formatTime(currentTime)}
        </Badge>
        <span className="text-gray-500">
          Active words: {getActiveWords().length}
        </span>
      </div>

      {/* Transcript Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Transcript - Click words to edit
          </Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingWordIndex(null)}
            className="text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Cancel Edit
          </Button>
        </div>
        
        <div className="min-h-[200px] max-h-[400px] overflow-y-auto p-3 border rounded-lg bg-gray-50 touch-pan-y">
          {transcript.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No transcript loaded. Load a clip to start editing.
            </p>
          ) : (
            <div className="flex flex-wrap leading-relaxed">
              {transcript.map((word, index) => {
                const isEditing = editingWordIndex === index;
                
                return isEditing ? (
                  <Input
                    key={word.id || index}
                    value={word.word}
                    onChange={(e) => handleWordEdit(index, e.target.value)}
                    onBlur={() => setEditingWordIndex(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        setEditingWordIndex(null);
                      }
                    }}
                    className="inline-block w-auto min-w-[40px] h-8 px-2 py-1 m-0.5 text-sm"
                    style={{ width: `${Math.max(word.word.length + 2, 4)}ch` }}
                    autoFocus
                  />
                ) : (
                  <span
                    key={word.id || index}
                    className={getWordStyling(word, index)}
                    onClick={() => handleWordClick(index)}
                    title={`${formatTime(word.start)} - ${formatTime(word.end)}`}
                  >
                    {word.word}
                  </span>
                );
              })}
            </div>
          )}
        </div>
        
        <p className="text-xs text-gray-500">
          Words highlighted in <span className="bg-blue-500 text-white px-1 rounded">blue</span> are currently being spoken.
          Click any word to edit it. Changes appear in real-time on the video.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => {
            // Reset to original - you'd implement this based on your needs
            console.log('Reset to original transcript');
          }}
        >
          Reset Changes
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => {
            // Save changes - you'd implement this based on your needs
            console.log('Save changes');
          }}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
