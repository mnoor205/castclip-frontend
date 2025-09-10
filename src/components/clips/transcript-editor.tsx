"use client";

import { useCallback, useState } from 'react';
import { useClipEditorStore } from '@/stores/clip-editor-store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Plus, Edit3, Trash2, PlusCircle, Move, RotateCw } from 'lucide-react';

interface TranscriptEditorProps {
  className?: string;
}

export function TranscriptEditor({ className = "" }: TranscriptEditorProps) {
  const {
    transcript,
    hook,
    currentTime,
    isPlaying,
    isEditMode,
    hookStyle,
    captionsStyle,
    selectedTextElement,
    dragState,
    updateWord,
    insertWord,
    deleteWord,
    setHook,
    setEditMode,
    resetTextStyles,
    setSelectedTextElement,
    getActiveWords
  } = useClipEditorStore();

  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [editingWordIndex, setEditingWordIndex] = useState<number | null>(null);
  const [insertingAtIndex, setInsertingAtIndex] = useState<number | null>(null);

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

  // Handle word click for selection
  const handleWordClick = useCallback((index: number) => {
    if (editingWordIndex !== null || insertingAtIndex !== null) {
      // If we're editing/inserting, don't change selection
      return;
    }
    setSelectedWordIndex(selectedWordIndex === index ? null : index);
  }, [selectedWordIndex, editingWordIndex, insertingAtIndex]);
  
  // Handle word editing
  const startWordEdit = useCallback((index: number) => {
    setEditingWordIndex(index);
    setSelectedWordIndex(null);
  }, []);
  
  // Handle word insertion
  const startWordInsert = useCallback((position: 'before' | 'after', index: number) => {
    const insertIndex = position === 'before' ? index : index + 1;
    setInsertingAtIndex(insertIndex);
    setSelectedWordIndex(null);
  }, []);
  
  // Complete word insertion
  const completeWordInsert = useCallback((index: number, newWord: string) => {
    if (newWord.trim()) {
      insertWord(index, newWord.trim());
    }
    setInsertingAtIndex(null);
  }, [insertWord]);
  
  // Handle word deletion
  const handleWordDelete = useCallback((index: number) => {
    if (window.confirm('Are you sure you want to delete this word?')) {
      deleteWord(index);
      setSelectedWordIndex(null);
    }
  }, [deleteWord]);
  
  // Clear all selections
  const clearSelections = useCallback(() => {
    setSelectedWordIndex(null);
    setEditingWordIndex(null);
    setInsertingAtIndex(null);
  }, []);

  // Check if word is currently active (being spoken)
  const isWordActive = useCallback((word: any) => {
    return currentTime >= word.start && currentTime <= word.end;
  }, [currentTime]);

  // Get word styling based on state
  const getWordStyling = useCallback((word: any, index: number) => {
    const isActive = isWordActive(word);
    const isSelected = selectedWordIndex === index;
    
    let classes = "inline-block px-2 py-1 m-1 rounded text-sm cursor-pointer transition-all border ";
    
    if (isActive) {
      classes += "bg-blue-500 text-white border-blue-600 shadow-lg ";
    } else if (isSelected) {
      classes += "bg-green-100 text-green-900 border-green-300 shadow-md ";
    } else {
      classes += "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 ";
    }
    
    return classes;
  }, [isWordActive, selectedWordIndex]);

  return (
    <div className={`flex flex-col gap-6 p-4 bg-white rounded-lg border ${className}`}>

      {/* Hook Editor */}
      <div className="space-y-2">
        <Label htmlFor="hook-input" className="text-sm font-medium">
          Hook
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

      {/* Transcript Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Transcript - Click words for options
          </Label>
        </div>
        
        <div className="min-h-[200px] max-h-[400px] overflow-y-auto p-4 border rounded-lg bg-gray-50 touch-pan-y">
          {transcript.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                No transcript loaded. Load a clip to start editing.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInsertingAtIndex(0)}
                className="gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Add First Word
              </Button>
            </div>
          ) : (
            <div className="leading-relaxed">
              {/* Word insertion at beginning */}
              {insertingAtIndex === 0 && (
                <div className="inline-flex items-center gap-2 mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <Input
                    placeholder="Enter new word..."
                    className="text-sm h-8"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        completeWordInsert(0, e.currentTarget.value);
                      } else if (e.key === 'Escape') {
                        setInsertingAtIndex(null);
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value.trim()) {
                        completeWordInsert(0, e.target.value);
                      } else {
                        setInsertingAtIndex(null);
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInsertingAtIndex(null)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
              
              <div className="flex flex-wrap items-start gap-1">
                {transcript.map((word, index) => {
                  const isEditing = editingWordIndex === index;
                  const isSelected = selectedWordIndex === index;
                  
                  return (
                    <div key={word.id || index} className="relative">
                      {/* Word element */}
                      {isEditing ? (
                        <Input
                          value={word.word}
                          onChange={(e) => handleWordEdit(index, e.target.value)}
                          onBlur={() => setEditingWordIndex(null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === 'Escape') {
                              setEditingWordIndex(null);
                            }
                          }}
                          className="text-sm h-8 min-w-[60px]"
                          style={{ width: `${Math.max(word.word.length + 2, 6)}ch` }}
                          autoFocus
                        />
                      ) : (
                        <>
                          <span
                            className={getWordStyling(word, index)}
                            onClick={() => handleWordClick(index)}
                            title={`${formatTime(word.start)} - ${formatTime(word.end)}\nClick for options`}
                          >
                            {word.word}
                          </span>
                          
                          {/* Action buttons for selected word */}
                          {isSelected && (
                            <div className="absolute top-full left-0 mt-1 flex flex-col gap-1 z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs bg-white hover:bg-gray-50 justify-start w-full"
                                onClick={() => startWordEdit(index)}
                              >
                                <Edit3 className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs bg-white hover:bg-gray-50 justify-start w-full"
                                onClick={() => startWordInsert('before', index)}
                              >
                                <PlusCircle className="w-3 h-3 mr-1" />
                                Add Before
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs bg-white hover:bg-gray-50 justify-start w-full"
                                onClick={() => startWordInsert('after', index)}
                              >
                                <PlusCircle className="w-3 h-3 mr-1" />
                                Add After
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-xs bg-white hover:bg-red-50 text-red-600 justify-start w-full"
                                onClick={() => handleWordDelete(index)}
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Word insertion interface */}
                      {insertingAtIndex === index + 1 && (
                        <div className="absolute top-full left-0 mt-1 p-2 bg-blue-50 border border-blue-200 rounded-lg shadow-lg z-10">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Enter new word..."
                              className="text-sm h-8 min-w-[120px]"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  completeWordInsert(index + 1, e.currentTarget.value);
                                } else if (e.key === 'Escape') {
                                  setInsertingAtIndex(null);
                                }
                              }}
                              onBlur={(e) => {
                                if (e.target.value.trim()) {
                                  completeWordInsert(index + 1, e.target.value);
                                } else {
                                  setInsertingAtIndex(null);
                                }
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() => setInsertingAtIndex(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p>
            <strong>Click any word</strong> to select it and see editing options. 
            Changes appear in real-time on the video.
          </p>
        </div>
      </div>
    </div>
  );
}
