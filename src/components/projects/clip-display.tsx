"use client";
import type { Clip as PrismaClip } from "@prisma/client";
import { Download, Youtube, Trash2, Loader2, Edit } from "lucide-react";
import { useEffect, useRef, useState, useTransition, RefObject } from "react";
import { Button } from "../ui/button";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteClip } from "@/actions/delete";
import { toast } from "sonner";
import { getClipVideoUrl, isClipEditable } from "@/lib/constants";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";

interface Clip extends PrismaClip {
  youtubeUrl?: string;
  project?: {
    captionStyle?: number | null;
  } | null;
}

function ClipCard({ clip, readOnly = false }: { clip: Clip; readOnly?: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(cardRef as RefObject<Element>);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const video = cardRef.current?.querySelector('video'); // More robust selector
      if (!video) return;

      if (document.fullscreenElement === video) {
        video.style.objectFit = "contain";
      } else {
        video.style.objectFit = "cover";
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleDelete = () => {
    startDeleteTransition(async () => {
      try {
        await deleteClip(clip.id);
        toast.success("Clip deleted successfully");
        setDialogOpen(false);
      } catch (error) {
        toast.error("Failed to delete clip", {
          description: error instanceof Error ? error.message : "An unknown error occurred.",
        });
      }
    });
  };

  const videoUrl = getClipVideoUrl(clip);
  const isEditable = !readOnly && isClipEditable(clip);

  return (
    <div ref={cardRef} className="flex w-full flex-col gap-2">
      <div className="relative w-full rounded-md overflow-hidden bg-muted aspect-[9/16]">
        {isVisible && videoUrl ? (
          <video
            src={videoUrl}
            controls
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-500">{videoUrl ? "Loading video..." : "Rendering in progress"}</span>
          </div>
        )}
      </div>
      <div className="flex flex-row gap-1 sm:gap-2">
        {clip.youtubeUrl ? (
          <Link
            className="flex flex-col gap-2 flex-1"
            href={clip.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
              <Youtube className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="sm:hidden">Watch</span>
              <span className="hidden sm:inline">Watch Original</span>
            </Button>
          </Link>
        ) : (
          <Button variant="outline" className="flex-1 text-xs sm:text-sm" size="sm" disabled={!videoUrl} asChild={!!videoUrl}>
            {videoUrl ? (
              <Link href={videoUrl}>
                <Download className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                Download
              </Link>
            ) : (
              <span className="flex items-center justify-center w-full">
                <Download className="mr-1 sm:mr-1.5 h-3 w-3 sm:h-4 sm:w-4" />
                Download
              </span>
            )}
          </Button>
        )}
        {isEditable && (
          <Link href={`/projects/${clip.projectId}/edit/${clip.id}`}>
            <Button variant="outline" size="sm">
              <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </Link>
        )}
        {!readOnly && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete the clip.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

export function ClipDisplay({ clips, readOnly = false, center = false }: { clips: Clip[]; readOnly?: boolean; center?: boolean }) {
  const sortedClips = [...clips].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sortedClips.length === 0) {
    return (
      <p className="text-muted-foreground p-4 text-center">
        No Clips Generated
      </p>
    );
  }

  if (center) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12 justify-items-center">
          {sortedClips.map((clip) => (
            <ClipCard key={clip.id} clip={clip} readOnly={readOnly} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
      {sortedClips.map((clip) => (
        <ClipCard key={clip.id} clip={clip} readOnly={readOnly} />
      ))}
    </div>
  );
}
