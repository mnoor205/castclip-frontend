"use client";

import { useClipEditorStore } from "@/stores/clip-editor-store";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type VideoType = {
  id: number;
  title: string;
  description: string;
  exampleVideoUrl: string;
  status?: "beta" | "coming-soon";
};

// Mirror video style options from legacy dashboard
const VIDEO_TYPES: VideoType[] = [
  {
    id: 1,
    title: "Classic Captions",
    description: "Clean, readable subtitles for a professional look.",
    exampleVideoUrl: "https://castclip.revolt-ai.com/app/examples/subtitles/default.gif",
  },
  {
    id: 3,
    title: "Karaoke Style",
    description: "Words are highlighted as they are spoken, like karaoke.",
    exampleVideoUrl: "https://castclip.revolt-ai.com/app/examples/subtitles/karaoke.gif",
  },
  {
    id: 99, // dummy id
    title: "More Styles Soon",
    description: "New and exciting caption styles are on the way!",
    exampleVideoUrl: "",
    status: "coming-soon",
  },
];

interface CaptionStyleSelectorProps {
  className?: string;
  selectedStyleId?: number | null;
  onStyleChange?: (styleId: number) => void;
}

export const CaptionStyleSelector = ({
  className,
  selectedStyleId,
  onStyleChange
}: CaptionStyleSelectorProps) => {
  // Use props if provided, otherwise fall back to store
  const storeCaptionStyleId = useClipEditorStore((state) => state.captionStyleId);
  const setCaptionStyleId = useClipEditorStore((state) => state.setCaptionStyleId);

  // Determine which style ID to use and which handler to call
  const captionStyleId = selectedStyleId ?? storeCaptionStyleId;
  const handleStyleChange = onStyleChange ?? setCaptionStyleId;

  const handleVideoTypeSelect = (typeId: number, disabled: boolean) => {
    if (disabled) return;
    handleStyleChange(typeId);
  };

  return (
    <div className={cn("flex flex-wrap justify-center gap-2 sm:gap-4", className)}>
      {VIDEO_TYPES.map((type) => {
        const isComingSoon = type.status === "coming-soon";
        const isSelected = captionStyleId === type.id;

        return (
          <div
            key={type.id}
            className={`group relative w-32 sm:w-40 ${
              isComingSoon ? "cursor-not-allowed" : "cursor-pointer"
            }`}
            onClick={() => handleVideoTypeSelect(type.id, !!isComingSoon)}
          >
            <div
              className={`relative w-full h-28 sm:h-32 overflow-hidden rounded-md sm:rounded-xl border sm:border-2 bg-muted transition-all duration-200 ${
                isSelected && !isComingSoon
                  ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/70"
                  : "border-border hover:border-primary/50 hover:shadow-lg"
              } ${isComingSoon ? "bg-muted/40" : ""}`}
            >
              {type.status === "beta" && (
                <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10">
                  <Badge
                    variant="default"
                    className="bg-primary text-white border border-pink-500/50 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5"
                  >
                    Beta
                  </Badge>
                </div>
              )}

              {isComingSoon ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Sparkles className="h-6 w-6 sm:h-10 sm:w-10 text-muted-foreground/50" />
                </div>
              ) : (
                <Image
                  className="h-full w-full object-cover object-bottom"
                  src={type.exampleVideoUrl}
                  alt={`${type.title} preview`}
                  width={400}
                  height={225}
                  key={type.exampleVideoUrl}
                  unoptimized
                />
              )}
            </div>

            <div className="pt-1 sm:pt-2 text-center">
              <h3 className="font-semibold text-[11px] sm:text-sm">{type.title}</h3>
            </div>
          </div>
        );
      })}
    </div>
  );
};