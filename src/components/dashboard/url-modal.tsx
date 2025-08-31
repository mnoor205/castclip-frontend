"use client"

import { useState, useMemo } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import GenerationOptions from "./generation-options"
import debounce from "lodash.debounce"
import { getYouTubeVideoDetails } from "@/actions/youtube"
import { Loader2 } from "lucide-react"
import { createProjectFromUrl } from "@/actions/generation"

type VideoDetails = {
  id: string
  title: string
  thumbnailUrl: string
}

interface UrlModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function UrlModal({ open, onOpenChange }: UrlModalProps) {
  const [url, setUrl] = useState("")
  const [clipCount, setClipCount] = useState<number>(1)
  const [captionStyle, setCaptionStyle] = useState<number>(1)
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const getYoutubeVideoId = (url: string) => {
    const regex =
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  const debouncedFetchDetails = useMemo(
    () =>
      debounce((newUrl: string) => {
        const id = getYoutubeVideoId(newUrl)
        if (id) {
          setIsLoadingDetails(true)
          getYouTubeVideoDetails(id)
            .then(setVideoDetails)
            .catch(() => {
              setVideoDetails(null)
              toast.error("Could not find YouTube video.", {
                description: "Please check the URL and try again.",
              })
            })
            .finally(() => setIsLoadingDetails(false))
        } else {
          setVideoDetails(null)
        }
      }, 500),
    []
  )

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value
    setUrl(newUrl)
    debouncedFetchDetails(newUrl)
  }

  const handleGenerate = async () => {
    if (!url || !videoDetails) {
      toast.error("Please enter a valid video URL.")
      return
    }

    setIsGenerating(true)
    try {
      await createProjectFromUrl({
        videoUrl: url,
        title: videoDetails.title,
        thumbnailUrl: videoDetails.thumbnailUrl,
        clipCount,
        captionStyle,
      })

      toast.success("Video Started Processing!", {
        description:
          "Your video has begun processing, it may take up to 15 minutes. We will send you an email when processing is complete!",
        duration: 8000,
      })
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to start generation.", {
        description: error instanceof Error ? error.message : "An unknown error occurred.",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl md:max-w-5xl lg:max-w-6xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Generate Clips from a Video URL</DialogTitle>
          <DialogDescription>
            Enter a YouTube video URL, choose your style, and we&apos;ll do the rest.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 max-h-[80vh] overflow-y-auto p-1 pr-3">
          {/* URL Input */}
          <div className="pt-4 px-3 sm:px-0">
            <div className="rounded-lg bg-gradient-primary p-0.5">
              <Input
                id="video-url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={url}
                onChange={handleUrlChange}
                className="w-full h-14 text-base bg-background border-0 rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
              />
            </div>
          </div>

          {isLoadingDetails && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {videoDetails && !isLoadingDetails && (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-full sm:w-80 text-center">
                <Image
                  src={videoDetails.thumbnailUrl}
                  alt={videoDetails.title}
                  width={320}
                  height={180}
                  className="rounded-lg object-cover w-full"
                  onError={(e) => {
                    // Fallback to a simple gray placeholder
                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNiI+VmlkZW8gVGh1bWJuYWlsPC90ZXh0Pgo8L3N2Zz4K'
                  }}
                />
                <p className="text-sm font-medium mt-2 truncate" title={videoDetails.title}>
                  {videoDetails.title}
                </p>
              </div>
            </div>
          )}

          {/* Generation Options Section */}
          <GenerationOptions
            captionStyle={captionStyle}
            onCaptionStyleChange={setCaptionStyle}
            clipCount={clipCount}
            onClipCountChange={setClipCount}
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={!videoDetails || isLoadingDetails || isGenerating} className="bg-gradient-primary text-white hover:bg-gradient-primary/90">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Clips"
              )}
            </Button>
          </div>
        </div>

        <DialogFooter className="hidden" />
      </DialogContent>
    </Dialog>
  )
}
