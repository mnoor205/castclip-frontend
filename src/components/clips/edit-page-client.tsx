"use client";

import { useRef, useCallback, useState } from "react";
import { MultiClipEditor, MultiClipEditorRef } from "./multi-clip-editor";
import { Button } from "@/components/ui/button";
import { Save, Loader2 } from "lucide-react";
import BackButton from "@/components/navigation/back-button";
import type { Clip } from "@prisma/client";

interface EditPageClientProps {
  projectId: string;
  clips: Clip[];
  projectTitle: string;
  captionStyle: number;
}

export function EditPageClient({ projectId, clips, projectTitle, captionStyle }: EditPageClientProps) {
  const editorRef = useRef<MultiClipEditorRef>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAll = useCallback(async (changes: any[], textPositioning: any) => {
    // For now, just log the changes as requested
    console.log("=== SAVE ALL TRIGGERED FROM BUTTON ===");
    console.log("Project ID:", projectId);
    console.log("Changes count:", changes.length);
    console.log("Changes:", changes);
    console.log("Text positioning:", textPositioning);
    console.log("=====================================");

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, [projectId]);

  const triggerSave = useCallback(async () => {
    if (!editorRef.current) return;
    
    setIsSaving(true);
    try {
      await editorRef.current.saveAll();
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const hasChanges = true; // You can get this from the editor state if needed

  return (
    <div className="w-full flex flex-col gap-6 px-4 sm:px-6 py-6 sm:py-10">
      {/* Header with Save Button */}
      <div className="flex items-center gap-4">
        <BackButton fallbackHref={`/projects/${projectId}`} />
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">
            Edit: {projectTitle}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {clips.length} clip{clips.length !== 1 ? 's' : ''} available for editing
          </p>
        </div>
        
        {/* Save All Button */}
        <Button
          onClick={triggerSave}
          disabled={isSaving}
          className="gap-2 text-white"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4 text-white" />
          )}
          <span className="hidden sm:inline">
            {isSaving ? "Saving..." : "Save All"}
          </span>
        </Button>
      </div>

      {/* Multi-Clip Editor */}
      <MultiClipEditor
        ref={editorRef}
        projectId={projectId}
        clips={clips}
        projectTitle={projectTitle}
        captionStyle={captionStyle}
        onSaveAll={handleSaveAll}
      />
    </div>
  );
}
