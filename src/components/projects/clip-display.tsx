"use client";
import type { Clip as PrismaClip } from "@prisma/client";
import { Download, Youtube, Trash2, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
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

interface Clip extends PrismaClip {
  youtubeUrl?: string;
}

function ClipCard({ clip, readOnly = false }: { clip: Clip; readOnly?: boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const video = videoRef.current;
      if (!video) return;

      if (document.fullscreenElement === video) {
        // Rare case if video itself goes fullscreen
        video.style.objectFit = "contain";
      } else if (
        document.fullscreenElement &&
        document.fullscreenElement.contains(video)
      ) {
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

  return (
    <div className="flex w-full flex-col gap-2">
      <div className="relative w-full rounded-md overflow-hidden bg-muted aspect-[9/16]">
        <video
          src={`https://castclip.revolt-ai.com/${clip.s3Key}`}
          controls
          ref={videoRef}
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {!readOnly && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-80 hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
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
      <div className="flex flex-col gap-2">
        {clip.youtubeUrl ? (
          <Link
            className="flex flex-col gap-2"
            href={clip.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm" className="w-full">
              <Youtube className="mr-1.5 h-4 w-4" />
              Watch Original
            </Button>
          </Link>
        ) : (
          <Link href={`https://castclip.revolt-ai.com/${clip.s3Key}`}>
            <Button variant="outline" className="w-full">
              <Download className="mr-1.5 h-4 w-4" />
              Download
            </Button>
          </Link>
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
