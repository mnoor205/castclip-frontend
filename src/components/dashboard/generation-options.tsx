"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Sparkles } from "lucide-react"
import Image from "next/image"

type VideoType = {
  id: number
  title: string
  description: string
  exampleVideoUrl: string
  status?: "beta" | "coming-soon"
}

// Mirror video style options from legacy dashboard
const VIDEO_TYPES: VideoType[] = [
  {
    id: 1,
    title: "Classic Captions",
    description: "Clean, readable subtitles for a professional look.",
    exampleVideoUrl: "https://castclip.revolt-ai.com/app/examples/subtitles/default.gif",
  },
  {
    id: 2,
    title: "Emoji Captions",
    description: "Engaging captions with relevant emojis that animate.",
    exampleVideoUrl: "https://castclip.revolt-ai.com/app/examples/subtitles/emoji.gif",
    status: "beta",
  },
  {
    id: 3,
    title: "Karaoke Style",
    description: "Words are highlighted as they are spoken, like karaoke.",
    exampleVideoUrl: "https://castclip.revolt-ai.com/app/examples/subtitles/karaoke.gif",
  },
  {
    id: 4,
    title: "More Styles Coming Soon",
    description: "We're always working on new and exciting caption styles.",
    exampleVideoUrl: "",
    status: "coming-soon",
  },
]

interface GenerationOptionsProps {
  captionStyle: number
  onCaptionStyleChange: (styleId: number) => void
  clipCount: number
  onClipCountChange: (count: number) => void
}

export default function GenerationOptions({
  captionStyle,
  onCaptionStyleChange,
  clipCount,
  onClipCountChange,
}: GenerationOptionsProps) {
  const handleVideoTypeSelect = (typeId: number, disabled: boolean) => {
    if (disabled) return
    onCaptionStyleChange(typeId)
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Caption style grid */}
      <div>
        <h3 className="text-lg font-medium mb-3">Choose Your Caption Style</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {VIDEO_TYPES.map((type) => {
            const isComingSoon = type.status === "coming-soon"
            const isSelected = captionStyle === type.id

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
            )
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Number of clips</span>
          <Select onValueChange={(value) => onClipCountChange(Number(value))}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder={clipCount} defaultValue={clipCount} />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
