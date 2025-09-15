"use client"

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useClipEditorStore } from "@/stores/clip-editor-store";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function BackButton({ fallbackHref = "/dashboard", confirmOnNavigate = false, confirmMessage = "You have unsaved changes. Leave without saving?" }: { fallbackHref?: string; confirmOnNavigate?: boolean; confirmMessage?: string; }) {
  const router = useRouter();
  const hasChanges = useClipEditorStore((s) => s.hasChanges);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleClick = () => {
    if (confirmOnNavigate && hasChanges && hasChanges()) {
      setShowConfirmDialog(true);
      return;
    }

    navigateBack();
  };

  const navigateBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  const handleConfirm = () => {
    setShowConfirmDialog(false);
    navigateBack();
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
  };

  return (
    <>
      <Button variant="ghost" className="hover:cursor-pointer" aria-label="Go back" onClick={handleClick}>
        <ArrowLeft className="h-5 w-5" />
      </Button>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              {confirmMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
