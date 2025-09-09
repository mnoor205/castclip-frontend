import { create } from 'zustand';

export interface TranscriptWord {
  word: string;
  start: number;
  end: number;
  id?: string; // We'll generate IDs for existing words
}

export interface EditorState {
  // Video state
  currentTime: number;
  isPlaying: boolean;
  duration: number;
  
  // Content state
  transcript: TranscriptWord[];
  hook: string;
  
  // Actions
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setDuration: (duration: number) => void;
  setTranscript: (transcript: TranscriptWord[]) => void;
  updateWord: (index: number, newText: string) => void;
  setHook: (hook: string) => void;
  
  // Computed
  getActiveWords: () => TranscriptWord[];
}

export const useClipEditorStore = create<EditorState>((set, get) => ({
  // Initial state
  currentTime: 0,
  isPlaying: false,
  duration: 0,
  transcript: [],
  hook: '',

  // Actions
  setCurrentTime: (time: number) => set({ currentTime: time }),
  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),
  setDuration: (duration: number) => set({ duration }),
  
  setTranscript: (transcript: TranscriptWord[]) => {
    // Add IDs to existing words if they don't have them
    const transcriptWithIds = transcript.map((word, index) => ({
      ...word,
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
  
  setHook: (hook: string) => set({ hook }),
  
  // Computed getters
  getActiveWords: () => {
    const { currentTime, transcript } = get();
    return transcript.filter(word => 
      currentTime >= word.start && currentTime <= word.end
    );
  }
}));

