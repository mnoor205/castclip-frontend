"use client"

import { useEffect, useState, useMemo } from "react"
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
import { getYouTubeVideos, searchYouTubeVideos } from "@/actions/youtube"
import { Input } from "@/components/ui/input"
import debounce from "lodash.debounce"
import { Loader2 } from "lucide-react"
import GenerationOptions from "./generation-options"
import { createProjectFromUrl } from "@/actions/generation"
import { useGoogleOAuth } from "@/hooks/use-google-oauth"

type Video = {
  id: string
  title: string
  thumbnailUrl: string
}

interface YouTubeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: {
    connected: boolean
    videos: Video[]
    nextPageToken: string | null | undefined
  } | null
  isLoading: boolean
  onDataNeedsRefresh: () => void
}

export default function YouTubeModal({
  open,
  onOpenChange,
  initialData,
  isLoading,
  onDataNeedsRefresh,
}: YouTubeModalProps) {
  const [loadingMore, setLoadingMore] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [clipCount, setClipCount] = useState<number>(1)
  const [captionStyle, setCaptionStyle] = useState<number>(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [youtubeData, setYoutubeData] = useState(initialData)
  const [searchedVideos, setSearchedVideos] = useState<{
    videos: Video[]
    nextPageToken: string | null | undefined
  } | null>(null)

  const { isScriptReady, isConnecting, connectGoogle } = useGoogleOAuth({
    onSuccess: () => {
      toast.success("Successfully connected your YouTube account!")
      onDataNeedsRefresh()
    },
  })

  useEffect(() => {
    setYoutubeData(initialData)
  }, [initialData])

  const fetchMoreBrowse = () => {
    if (!youtubeData?.nextPageToken) return
    setLoadingMore(true)
    getYouTubeVideos(youtubeData.nextPageToken)
      .then((data) => {
        setYoutubeData((prevData) => ({
          connected: data.connected,
          videos: [...(prevData?.videos ?? []), ...data.videos],
          nextPageToken: data.nextPageToken,
        }))
      })
      .finally(() => setLoadingMore(false))
  }

  const fetchSearchResults = (query: string, token?: string) => {
    if (!token) setIsSearching(true)
    else setLoadingMore(true)

    searchYouTubeVideos(query, token)
      .then((data) => {
        setSearchedVideos((prevData) => ({
          videos: token ? [...(prevData?.videos ?? []), ...data.videos] : data.videos,
          nextPageToken: data.nextPageToken,
        }))
      })
      .finally(() => {
        setIsSearching(false)
        setLoadingMore(false)
      })
  }

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        if (query) {
          fetchSearchResults(query)
        } else {
          setSearchedVideos(null)
          setIsSearching(false)
        }
      }, 500),
    []
  )

  useEffect(() => {
    debouncedSearch(searchQuery)
    return () => debouncedSearch.cancel()
  }, [searchQuery, debouncedSearch])

  useEffect(() => {
    if (!open) {
      setSearchedVideos(null)
      setSearchQuery("")
      setSelectedVideo(null)
    }
  }, [open])

  const handleSelectVideo = (video: Video) => {
    setSelectedVideo(video)
  }

  const handleGenerate = async () => {
    if (!selectedVideo) return
    setIsGenerating(true)
    try {
      const videoUrl = `https://www.youtube.com/watch?v=${selectedVideo.id}`
      await createProjectFromUrl({
        videoUrl,
        title: selectedVideo.title,
        thumbnailUrl: selectedVideo.thumbnailUrl,
        clipCount,
        captionStyle,
      })
      toast.success("Video sent for processing!", {
        description: "We'll send you an email when your clips are ready.",
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

  const locallyFilteredVideos = useMemo(() => {
    if (!searchQuery) return youtubeData?.videos ?? []
    return (youtubeData?.videos ?? []).filter((v) => v.title.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery, youtubeData?.videos])

  const videosToDisplay = useMemo(() => {
    if (!searchQuery) {
      return youtubeData?.videos ?? []
    }
    // Combine local results with backend search results
    const combined = [...locallyFilteredVideos, ...(searchedVideos?.videos ?? [])]
    // Deduplicate the list
    return Array.from(new Map(combined.map((v) => [v.id, v])).values())
  }, [searchQuery, youtubeData, searchedVideos, locallyFilteredVideos])

  const hasMoreToLoad = searchQuery ? !!searchedVideos?.nextPageToken : !!youtubeData?.nextPageToken

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-4xl md:max-w-5xl lg:max-w-6xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {youtubeData?.connected ? "Select a Video & Style Your Clips" : "Connect your YouTube Channel"}
          </DialogTitle>
          <DialogDescription>
            {youtubeData?.connected
              ? "Search for a video, select it, and then choose your generation options."
              : "We will request read-only access to list your channel and latest videos."}
          </DialogDescription>
        </DialogHeader>

        {isLoading && <div className="text-center p-8">Loading...</div>}

        {!isLoading && youtubeData?.connected && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto p-1 pr-3">
            {/* Video Selection Section */}
            <div>
              <div className="px-4 relative mb-4">
                <Input
                  placeholder="Search your videos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-10"
                />
                {isSearching && (
                  <div className="absolute inset-y-0 right-7 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              {videosToDisplay.length > 0 ? (
                <div className="flex overflow-x-auto space-x-4 p-4 scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-muted">
                  {videosToDisplay.map((video) => {
                    const isSelected = selectedVideo?.id === video.id
                    return (
                      <div
                        key={video.id}
                        className="flex-shrink-0 w-48 sm:w-60 text-center cursor-pointer group"
                        onClick={() => handleSelectVideo(video)}
                      >
                        <div
                          className={`relative rounded-lg overflow-hidden border-4 transition-all ${
                            isSelected ? "border-primary" : "border-transparent"
                          }`}
                        >
                          <Image
                            src={video.thumbnailUrl}
                            alt={video.title}
                            width={240}
                            height={135}
                            className="object-cover w-48 sm:w-60 h-27 sm:h-34 transition-all group-hover:brightness-75"
                            onError={(e) => {
                              // Fallback to a simple gray placeholder
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQwIiBoZWlnaHQ9IjEzNSIgdmlld0JveD0iMCAwIDI0MCAxMzUiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyNDAiIGhlaWdodD0iMTM1IiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+VmlkZW8gVGh1bWJuYWlsPC90ZXh0Pgo8L3N2Zz4K'
                            }}
                          />
                          <div
                            className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                              isSelected ? "bg-primary/50" : "opacity-0 group-hover:opacity-100 bg-black/50"
                            }`}
                          >
                            <p className="text-white font-bold text-lg">{isSelected ? "Selected" : "Select"}</p>
                          </div>
                        </div>
                        <p className="text-sm font-medium mt-2 truncate" title={video.title}>
                          {video.title}
                        </p>
                      </div>
                    )
                  })}
                  {hasMoreToLoad && (
                    <div className="flex-shrink-0 w-48 sm:w-60 flex items-center justify-center">
                      <Button
                        onClick={() =>
                          searchQuery
                            ? fetchSearchResults(searchQuery, searchedVideos?.nextPageToken as string)
                            : fetchMoreBrowse()
                        }
                        disabled={loadingMore}
                      >
                        {loadingMore ? "Loading..." : "Load More"}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {searchQuery && !isSearching
                    ? `No results found for "${searchQuery}"`
                    : !searchQuery
                    ? "You have no videos posted."
                    : ""}
                </p>
              )}
            </div>

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
              <Button onClick={handleGenerate} disabled={!selectedVideo || isGenerating}>
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
        )}

        {!isLoading && !youtubeData?.connected && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">Click the button below to connect via Google.</p>
            <div>
              <Button 
                onClick={connectGoogle} 
                disabled={isConnecting || !isScriptReady} 
                className="bg-gradient-primary text-white border-0"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : !isScriptReady ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading Google Services...
                  </>
                ) : (
                  "Connect YouTube"
                )}
              </Button>
            </div>
            {!isScriptReady && (
              <p className="text-xs text-muted-foreground">
                Please wait while Google services are loading...
              </p>
            )}
          </div>
        )}

        <DialogFooter className="hidden" />
      </DialogContent>
    </Dialog>
  )
}

