"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CaptionStyleSelector } from "../editor/caption-style-selector"

interface GenerationOptionsProps {
  captionStyle: number
  onCaptionStyleChange: (styleId: number) => void
  clipCount: number
  onClipCountChange: (count: number) => void
}

export default function GenerationOptions({
  clipCount,
  onClipCountChange,
  captionStyle,
  onCaptionStyleChange,
}: GenerationOptionsProps) {
  return (
    <div className="space-y-6 pt-4">
      {/* Caption style grid */}
      <div>
        <h3 className="text-lg font-medium mb-3">Choose Your Caption Style</h3>
        <CaptionStyleSelector
          className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4"
          selectedStyleId={captionStyle}
          onStyleChange={onCaptionStyleChange}
        />
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
