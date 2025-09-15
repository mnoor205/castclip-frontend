import { create } from 'zustand';
import { CLIP_CONFIG } from '@/lib/constants';
import { VIDEO_GENERATION } from '@/lib/constants';

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
  id?: string; // We'll generate IDs for existing words
}

export interface TextPosition {
  x: number; // Percentage (0-100) from left
  y: number; // Percentage (0-100) from top
}

export interface TextStyle {
  fontSize: number; // Font size in pixels
  position: TextPosition;
}

export interface DragState {
  isDragging: boolean;
  dragTarget: 'hook' | 'captions' | null;
  dragOffset: { x: number; y: number };
  isResizing: boolean;
  resizeHandle: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;
  // Store initial resize state for better UX
  initialResizeData: {
    handlePosition: { x: number; y: number };
    fontSize: number;
    textPosition: { x: number; y: number };
  } | null;
}

export interface EditorState {
  // Video state
  currentTime: number;
  isPlaying: boolean;
  duration: number;
  
  // Content state
  transcript: TranscriptWord[];
  hook: string;
  
  // Edit mode
  isEditMode: boolean;
  
  // Text styling and positioning
  hookStyle: TextStyle;
  captionsStyle: TextStyle;
  selectedTextElement: 'hook' | 'captions' | null;
  dragState: DragState;

  // Caption style preference from project settings
  captionStylePreference: number | null;
  
  // Original state for change tracking
  originalState: {
    transcript: TranscriptWord[];
    hook: string;
    hookStyle: TextStyle;
    captionsStyle: TextStyle;
  } | null;
}

export interface EditorActions {
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setDuration: (duration: number) => void;
  
  setTranscript: (transcript: TranscriptWord[]) => void;
  
  updateWord: (index: number, newText: string) => void;
  
  insertWord: (index: number, word: string) => void;
  
  deleteWord: (index: number) => void;
  
  setHook: (hook: string) => void;
  setEditMode: (enabled: boolean) => void;
  setProjectStylePreference: (styleId: number) => void;
  
  // Text positioning and styling actions
  updateHookStyle: (style: Partial<TextStyle>) => void;
  
  updateCaptionsStyle: (style: Partial<TextStyle>) => void;
  
  setSelectedTextElement: (element: 'hook' | 'captions' | null) => void;
  
  startDrag: (target: 'hook' | 'captions', offset: { x: number; y: number }) => void;
  
  updateDrag: (position: TextPosition) => void;
  
  endDrag: () => void;
  
  startResize: (target: 'hook' | 'captions', handle: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right', handlePosition: { x: number; y: number }) => void;
  
  updateResize: (fontSize: number) => void;
  
  endResize: () => void;
  
  resetTextStyles: () => void;
  
  // Change tracking actions
  initializeOriginalState: (transcript: TranscriptWord[], hook: string, hookStyle: TextStyle, captionsStyle: TextStyle) => void;
  initializeStyles: (hookStyle: TextStyle | null, captionsStyle: TextStyle | null, projectStyle: number | null) => void;
  hasChanges: () => boolean;
  getChanges: () => Partial<{ transcript: TranscriptWord[]; hook: string; hookStyle: TextStyle; captionsStyle: TextStyle; }>;
  markAsSaved: () => void;
  resetState: () => void;
  _deepEqual: (a: any, b: any) => boolean;
  
  // Computed getters
  getActiveWords: () => TranscriptWord[];
}

export type EditorStore = EditorState & EditorActions;

export const useClipEditorStore = create<EditorStore>((set, get) => ({
  // Initial state
  currentTime: 0,
  isPlaying: false,
  duration: 0,
  transcript: [],
  hook: '',
  isEditMode: false,
  
  // Default text styling and positioning
  hookStyle: { ...CLIP_CONFIG.DEFAULT_HOOK_STYLE },
  captionsStyle: { ...CLIP_CONFIG.DEFAULT_CAPTIONS_STYLE },
  selectedTextElement: null,
  dragState: {
    isDragging: false,
    dragTarget: null,
    dragOffset: { x: 0, y: 0 },
    isResizing: false,
    resizeHandle: null,
    initialResizeData: null
  },
  captionStylePreference: null,
  originalState: null,

  // Actions
  setCurrentTime: (time: number) => set({ currentTime: time }),
  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),
  setDuration: (duration: number) => set({ duration }),
  
  setTranscript: (transcript: TranscriptWord[]) => {
    if (transcript.length === 0) {
      set({ transcript: [] });
      return;
    }
    
    // Find the minimum start time to normalize timestamps to start at 0
    const minStartTime = Math.min(...transcript.map(word => word.start));
    
    // Normalize timestamps and add IDs to existing words if they don't have them
    const transcriptWithIds = transcript.map((word, index) => ({
      ...word,
      start: word.start - minStartTime,
      end: word.end - minStartTime,
      id: word.id || `word_${index}_${Date.now()}`
    }));
    
    set({ transcript: transcriptWithIds });
  },
  
  updateWord: (index: number, newText: string) => {
    const transcript = get().transcript;
    const updatedTranscript = transcript.map((word, i) => 
      i === index ? { ...word, word: newText } : word
    );
    set({ transcript: updatedTranscript });
  },
  
  insertWord: (index: number, word: string) => {
    const transcript = get().transcript;
    
    // Calculate timestamps for the new word
    let start: number, end: number;
    
    if (transcript.length === 0) {
      // First word in empty transcript
      start = 0;
      end = 1;
    } else if (index === 0) {
      // Insert at beginning
      const nextWord = transcript[0];
      end = nextWord.start;
      start = Math.max(0, end - 0.5);
    } else if (index >= transcript.length) {
      // Insert at end
      const prevWord = transcript[transcript.length - 1];
      start = prevWord.end;
      end = start + 0.5;
    } else {
      // Insert between words
      const prevWord = transcript[index - 1];
      const nextWord = transcript[index];
      const gap = nextWord.start - prevWord.end;
      
      if (gap > 0.5) {
        // Enough gap - center the new word
        const duration = Math.min(0.5, gap * 0.4);
        const center = prevWord.end + (gap / 2);
        start = center - (duration / 2);
        end = center + (duration / 2);
      } else {
        // Small gap - squeeze it in
        start = prevWord.end;
        end = nextWord.start;
      }
    }
    
    const newWord: TranscriptWord = {
      word: word.trim(),
      start,
      end,
      id: `inserted_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    const updatedTranscript = [
      ...transcript.slice(0, index),
      newWord,
      ...transcript.slice(index)
    ];
    
    set({ transcript: updatedTranscript });
  },
  
  deleteWord: (index: number) => {
    const transcript = get().transcript;
    if (index >= 0 && index < transcript.length) {
      const updatedTranscript = transcript.filter((_, i) => i !== index);
      set({ transcript: updatedTranscript });
    }
  },
  
  setHook: (hook: string) => set({ hook }),
  setEditMode: (enabled: boolean) => set({ isEditMode: enabled }),
  setProjectStylePreference: (styleId: number) => set({ captionStylePreference: styleId }),
  
  // Text positioning and styling actions
  updateHookStyle: (style: Partial<TextStyle>) => {
    set(state => ({
      hookStyle: { ...state.hookStyle, ...style }
    }));
  },
  
  updateCaptionsStyle: (style: Partial<TextStyle>) => {
    set(state => ({
      captionsStyle: { ...state.captionsStyle, ...style }
    }));
  },
  
  setSelectedTextElement: (element: 'hook' | 'captions' | null) => {
    set({ selectedTextElement: element });
  },
  
  startDrag: (target: 'hook' | 'captions', offset: { x: number; y: number }) => {
    set({
      selectedTextElement: target,
      dragState: {
        isDragging: true,
        dragTarget: target,
        dragOffset: offset,
        isResizing: false,
        resizeHandle: null,
        initialResizeData: null
      }
    });
  },
  
  updateDrag: (position: TextPosition) => {
    const { dragState } = get();
    if (!dragState.isDragging || !dragState.dragTarget) return;
    
    // Constrain position to bounds (with some padding)
    const constrainedPosition = {
      x: Math.max(CLIP_CONFIG.POSITION_BOUNDS.MIN, Math.min(CLIP_CONFIG.POSITION_BOUNDS.MAX, position.x)),
      y: Math.max(CLIP_CONFIG.POSITION_BOUNDS.MIN, Math.min(CLIP_CONFIG.POSITION_BOUNDS.MAX, position.y))
    };
    
    if (dragState.dragTarget === 'hook') {
      set(state => ({
        hookStyle: {
          ...state.hookStyle,
          position: constrainedPosition
        }
      }));
    } else if (dragState.dragTarget === 'captions') {
      set(state => ({
        captionsStyle: {
          ...state.captionsStyle,
          position: constrainedPosition
        }
      }));
    }
  },
  
  endDrag: () => {
    set(state => ({
      dragState: {
        ...state.dragState,
        isDragging: false,
        dragTarget: null,
        dragOffset: { x: 0, y: 0 },
        initialResizeData: null
      }
    }));
  },
  
  startResize: (target: 'hook' | 'captions', handle: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right', handlePosition: { x: number; y: number }) => {
    const state = get();
    const currentStyle = target === 'hook' ? state.hookStyle : state.captionsStyle;
    
    set({
      selectedTextElement: target,
      dragState: {
        isDragging: false,
        dragTarget: target,
        dragOffset: { x: 0, y: 0 },
        isResizing: true,
        resizeHandle: handle,
        initialResizeData: {
          handlePosition: { ...handlePosition },
          fontSize: currentStyle.fontSize,
          textPosition: { ...currentStyle.position }
        }
      }
    });
  },
  
  updateResize: (fontSize: number) => {
    const { dragState } = get();
    if (!dragState.isResizing || !dragState.dragTarget) return;
    
    // Constrain font size to reasonable bounds
    const constrainedSize = Math.max(CLIP_CONFIG.FONT_SIZE_BOUNDS.MIN, Math.min(CLIP_CONFIG.FONT_SIZE_BOUNDS.MAX, fontSize));
    
    if (dragState.dragTarget === 'hook') {
      set(state => ({
        hookStyle: {
          ...state.hookStyle,
          fontSize: constrainedSize
        }
      }));
    } else if (dragState.dragTarget === 'captions') {
      set(state => ({
        captionsStyle: {
          ...state.captionsStyle,
          fontSize: constrainedSize
        }
      }));
    }
  },
  
  endResize: () => {
    set(state => ({
      dragState: {
        ...state.dragState,
        isResizing: false,
        dragTarget: null,
        resizeHandle: null,
        initialResizeData: null
      }
    }));
  },
  
  resetTextStyles: () => {
    set({
      hookStyle: { ...CLIP_CONFIG.DEFAULT_HOOK_STYLE },
      captionsStyle: { ...CLIP_CONFIG.DEFAULT_CAPTIONS_STYLE },
      selectedTextElement: null,
      dragState: {
        isDragging: false,
        dragTarget: null,
        dragOffset: { x: 0, y: 0 },
        isResizing: false,
        resizeHandle: null,
        initialResizeData: null
      }
    });
  },
  
  // Helper function for deep equality (used by change tracking)
  _deepEqual: (a: any, b: any): boolean => {
    const deepEqual = (x: any, y: any): boolean => {
      if (x === y) return true;
      if (x == null || y == null) return false;
      if (typeof x !== 'object' || typeof y !== 'object') return false;
      
      const keysX = Object.keys(x);
      const keysY = Object.keys(y);
      
      if (keysX.length !== keysY.length) return false;
      
      for (let key of keysX) {
        if (!keysY.includes(key)) return false;
        if (!deepEqual(x[key], y[key])) return false;
      }
      
      return true;
    };
    
    return deepEqual(a, b);
  },
  
  // Change tracking functions
  initializeOriginalState: (transcript: TranscriptWord[], hook: string, hookStyle: TextStyle, captionsStyle: TextStyle) => {
    set({
      originalState: {
        transcript: JSON.parse(JSON.stringify(transcript)), // Deep copy
        hook,
        hookStyle: JSON.parse(JSON.stringify(hookStyle)),
        captionsStyle: JSON.parse(JSON.stringify(captionsStyle))
      }
    });
  },

  initializeStyles: (hookStyle: TextStyle | null, captionsStyle: TextStyle | null, projectStyle: number | null) => {
    let finalHookStyle: TextStyle = { ...CLIP_CONFIG.DEFAULT_HOOK_STYLE };
    if (hookStyle) {
      finalHookStyle = hookStyle;
    }

    let finalCaptionsStyle: TextStyle = { ...CLIP_CONFIG.DEFAULT_CAPTIONS_STYLE };
    if (captionsStyle) {
      finalCaptionsStyle = captionsStyle;
    } else if (projectStyle && (VIDEO_GENERATION.CAPTION_STYLES as Record<number, any>)[projectStyle]) {
      finalCaptionsStyle = { ...(VIDEO_GENERATION.CAPTION_STYLES as Record<number, any>)[projectStyle] };
    }
    
    set({
      hookStyle: finalHookStyle,
      captionsStyle: finalCaptionsStyle,
    });
  },
  
  hasChanges: () => {
    const { originalState, transcript, hook, hookStyle, captionsStyle, _deepEqual } = get();
    if (!originalState) return false;
    
    return !_deepEqual(transcript, originalState.transcript) ||
           hook !== originalState.hook ||
           !_deepEqual(hookStyle, originalState.hookStyle) ||
           !_deepEqual(captionsStyle, originalState.captionsStyle);
  },
  
  getChanges: () => {
    const { originalState, transcript, hook, hookStyle, captionsStyle, _deepEqual } = get();
    if (!originalState) return {};
    
    const changes: Partial<{ transcript: TranscriptWord[]; hook: string; hookStyle: TextStyle; captionsStyle: TextStyle; }> = {};
    
    if (!_deepEqual(transcript, originalState.transcript)) {
      changes.transcript = transcript;
    }
    
    if (hook !== originalState.hook) {
      changes.hook = hook;
    }
    
    if (!_deepEqual(hookStyle, originalState.hookStyle)) {
      changes.hookStyle = hookStyle;
    }
    
    if (!_deepEqual(captionsStyle, originalState.captionsStyle)) {
      changes.captionsStyle = captionsStyle;
    }
    
    return changes;
  },
  
  markAsSaved: () => {
    const { transcript, hook, hookStyle, captionsStyle } = get();
    set({
      originalState: {
        transcript: JSON.parse(JSON.stringify(transcript)), // Deep copy
        hook,
        hookStyle: JSON.parse(JSON.stringify(hookStyle)), // Deep copy for consistency
        captionsStyle: JSON.parse(JSON.stringify(captionsStyle)) // Deep copy for consistency
      }
    });
  },

  resetState: () => {
    set({
      currentTime: 0,
      isPlaying: false,
      duration: 0,
      transcript: [],
      hook: '',
      isEditMode: false,
      hookStyle: { ...CLIP_CONFIG.DEFAULT_HOOK_STYLE },
      captionsStyle: { ...CLIP_CONFIG.DEFAULT_CAPTIONS_STYLE },
      selectedTextElement: null,
    dragState: {
      isDragging: false,
      dragTarget: null,
      dragOffset: { x: 0, y: 0 },
      isResizing: false,
      resizeHandle: null,
      initialResizeData: null
    },
      originalState: null
    });
  },
  
  // Computed getters
  getActiveWords: () => {
    const { currentTime, transcript } = get();
    
    if (transcript.length === 0) return [];
    
    // Find the current word index
    let currentWordIndex = -1;
    for (let i = 0; i < transcript.length; i++) {
      if (currentTime >= transcript[i].start && currentTime <= transcript[i].end) {
        currentWordIndex = i;
        break;
      }
    }
    
    // If no word is exactly active, find the closest upcoming word
    if (currentWordIndex === -1) {
      for (let i = 0; i < transcript.length; i++) {
        if (currentTime < transcript[i].start) {
          currentWordIndex = i;
          break;
        }
      }
    }
    
    // If still no word found, find the last word that has passed
    if (currentWordIndex === -1) {
      for (let i = transcript.length - 1; i >= 0; i--) {
        if (currentTime >= transcript[i].start) {
          currentWordIndex = i;
          break;
        }
      }
    }
    
    // If we found a current word, determine which group of 3 it belongs to
    if (currentWordIndex >= 0) {
      // Calculate which group of 3 this word belongs to
      const groupIndex = Math.floor(currentWordIndex / 3);
      const startIndex = groupIndex * 3;
      const endIndex = Math.min(transcript.length - 1, startIndex + 2);
      
      return transcript.slice(startIndex, endIndex + 1);
    }
    
    return [];
  }
}));

