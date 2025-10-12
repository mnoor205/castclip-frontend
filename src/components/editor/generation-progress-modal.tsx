"use client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

interface GenerationProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clipId: string;
  progress: number;
  status: 'idle' | 'processing' | 'completed' | 'failed';
  renderedVideoUrl?: string | null;
  error?: string;
}

export function GenerationProgressModal({
  open,
  onOpenChange,
  clipId,
  progress,
  status,
  renderedVideoUrl,
  error,
}: GenerationProgressModalProps) {

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      // Only allow closing if completed or failed
      if (status === 'processing') return;
      onOpenChange(isOpen);
    }}>
      <DialogContent 
        className={`sm:max-w-md ${status === 'processing' ? '[&>button]:hidden' : ''}`}
        onPointerDownOutside={(e) => {
          // Prevent closing by clicking outside
          if (status === 'processing') {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing with Escape key
          if (status === 'processing') {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {status === 'processing' && 'Generating video'}
            {status === 'completed' && 'Video ready'}
            {status === 'failed' && 'Generation failed'}
          </DialogTitle>
          {status === 'failed' && (
            <DialogDescription>Something went wrong during video generation.</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {status === 'processing' && (
            <div className="space-y-3">
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Generating…</span>
                <span className="tabular-nums" aria-live="polite">{Math.round(progress)}%</span>
              </div>
            </div>
          )}

          {status === 'completed' && renderedVideoUrl && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Your video is ready with all edits applied</span>
              </div>
              <div className="flex gap-2">
                <Button asChild className="flex-1">
                  <Link href={renderedVideoUrl} download={`clip-${clipId}.mp4`}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Link>
                </Button>
                <Button onClick={() => onOpenChange(false)} variant="outline" className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}

          {status === 'failed' && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 text-sm text-red-700">
                <XCircle className="h-5 w-5" />
                <p>{error || 'An unexpected error occurred during video generation. Please try again.'}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => onOpenChange(false)} variant="outline" className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

