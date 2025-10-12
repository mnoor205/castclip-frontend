"use client";

import { useClipEditorStore } from "@/stores/clip-editor-store";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles } from "lucide-react";
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
    <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4", className)}>
      {VIDEO_TYPES.map((type) => {
        const isComingSoon = type.status === "coming-soon";
        const isSelected = captionStyleId === type.id;

        return (
          <div
            key={type.id}
            className={`group relative rounded-xl border-2 transition-all duration-200 ${
              isComingSoon ? "cursor-not-allowed bg-muted/40" : "cursor-pointer hover:shadow-lg"
            } ${
              isSelected && !isComingSoon
                ? "border-primary bg-primary/5 shadow-md"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => handleVideoTypeSelect(type.id, !!isComingSoon)}
          >
            {isSelected && !isComingSoon && (
              <div className="absolute -top-2 -right-2 z-10">
                <div className="bg-primary rounded-full p-1">
                  <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            )}

            {type.status === "beta" && (
              <div className="absolute top-2 left-2 z-10">
                <Badge variant="default" className="bg-primary text-white border border-pink-500/50">
                  Beta
                </Badge>
              </div>
            )}

            <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
              {isComingSoon ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Sparkles className="h-10 w-10 text-muted-foreground/50" />
                </div>
              ) : (
                <Image
                  className="h-full w-full object-cover"
                  src={type.exampleVideoUrl}
                  alt={`${type.title} preview`}
                  width={400}
                  height={225}
                  key={type.exampleVideoUrl}
                  unoptimized
                />
              )}
            </div>

            <div className="p-2 sm:p-3">
              <h3 className="font-semibold text-xs sm:text-sm mb-1 sm:mb-2">{type.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed hidden sm:block">
                {type.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};