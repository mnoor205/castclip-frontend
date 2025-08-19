"use client"

import { useEffect, useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { getYouTubeVideos, searchYouTubeVideos, validateYouTubeChannel, connectYouTubeChannel } from "@/actions/youtube"
import { ExternalLink } from "lucide-react"
import debounce from "lodash.debounce"
import { Loader2 } from "lucide-react"
import GenerationOptions from "./generation-options"
import VideoSelector from "./video-selector"
import { createProjectFromUrl } from "@/actions/generation"
import type { Video, YouTubeResponse, VideoSelectorData, YouTubeChannel } from "@/lib/types"
import Image from "next/image"

interface ChannelModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData: YouTubeResponse | null
  isLoading: boolean
  onDataNeedsRefresh: () => void
}

export default function ChannelModal({
  open,
  onOpenChange,
  initialData,
  isLoading,
  onDataNeedsRefresh,
}: ChannelModalProps) {
  const [loadingMore, setLoadingMore] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [clipCount, setClipCount] = useState<number>(1)
  const [captionStyle, setCaptionStyle] = useState<number>(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [youtubeData, setYoutubeData] = useState(initialData)
  const [searchedVideos, setSearchedVideos] = useState<VideoSelectorData | null>(null)
  
  // Channel connection state
  const [channelInput, setChannelInput] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [validatedChannel, setValidatedChannel] = useState<YouTubeChannel | null>(null)

  useEffect(() => {
    setYoutubeData(initialData)
  }, [initialData])

  const validateChannel = async () => {
    if (!channelInput.trim()) {
      toast.error("Please enter a YouTube channel ID")
      return
    }

    setIsValidating(true)
    try {
      const channelInfo = await validateYouTubeChannel(channelInput.trim())
      setValidatedChannel(channelInfo)
      toast.success("Channel found! Review the details below.")
    } catch (error) {
      console.error("Failed to validate channel:", error)
      toast.error("Channel validation failed", {
        description: error instanceof Error ? error.message : "Please check your input and try again."
      })
      setValidatedChannel(null)
    } finally {
      setIsValidating(false)
    }
  }

  const connectChannel = async () => {
    if (!validatedChannel) return

    setIsConnecting(true)
    try {
      await connectYouTubeChannel(validatedChannel)
      toast.success("YouTube channel connected successfully!")
      
      // Refresh YouTube data
      onDataNeedsRefresh()
    } catch (error) {
      console.error("Failed to connect channel:", error)
      toast.error("Connection failed", {
        description: error instanceof Error ? error.message : "Please try again."
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleInputChange = (value: string) => {
    setChannelInput(value)
    setValidatedChannel(null) // Clear validation when input changes
  }

  const formatSubscriberCount = (count?: string) => {
    if (!count) return "Unknown"
    const num = parseInt(count)
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

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

  useEffect(() => {
    if (!open) {
      setSearchedVideos(null)
      setSearchQuery("")
      setSelectedVideo(null)
      setValidatedChannel(null)
      setChannelInput("")
    }
  }, [open])

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
        className={youtubeData?.connected ? "sm:max-w-4xl md:max-w-5xl lg:max-w-6xl" : "sm:max-w-2xl"}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {youtubeData?.connected ? "Select a Video & Style Your Clips" : "Connect your YouTube Channel"}
          </DialogTitle>
          <DialogDescription>
            {youtubeData?.connected
              ? "Search for a video, select it, and then choose your generation options."
              : "Enter your YouTube channel ID to connect your channel."}
          </DialogDescription>
        </DialogHeader>

        {isLoading && <div className="text-center p-8">Loading...</div>}

        {!isLoading && youtubeData?.connected && (
          <div className="space-y-6 max-h-[80vh] overflow-y-auto p-1 pr-3">
            {/* Video Selection Section */}
            <VideoSelector
              videos={videosToDisplay}
              selectedVideo={selectedVideo}
              onSelectVideo={handleSelectVideo}
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              isSearching={isSearching}
              searchedVideos={searchedVideos}
              hasMoreToLoad={hasMoreToLoad}
              onLoadMore={() => 
                searchQuery
                  ? fetchSearchResults(searchQuery, searchedVideos?.nextPageToken as string)
                  : fetchMoreBrowse()
              }
              loadingMore={loadingMore}
              emptyMessage="You have no videos posted."
              searchPlaceholder="Search your videos..."
            />

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
              <Button onClick={handleGenerate} disabled={!selectedVideo || isGenerating} className="bg-gradient-primary text-white hover:bg-gradient-primary/90">
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
          <div className="flex flex-col gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div>
                <label htmlFor="channel-input" className="text-sm font-medium mb-2 block">
                  YouTube Channel ID (22 characters starting with &quot;UC&quot;)
                </label>
                <div className="space-y-2">
                  <Input
                    id="channel-input"
                    placeholder="UC1234567890123456789012"
                    value={channelInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    disabled={isValidating || isConnecting}
                  />
                  <div className="text-xs text-muted-foreground">
                    <p>
                      <strong>How to find your channel ID:</strong> Go to your YouTube channel → Settings → Advanced settings → Channel ID
                    </p>
                  </div>
                </div>
              </div>

              {!validatedChannel && (
                <Button 
                  onClick={validateChannel} 
                  disabled={isValidating || !channelInput.trim()} 
                  className="w-full bg-gradient-primary text-white hover:bg-gradient-primary/90"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finding Channel...
                    </>
                  ) : (
                    "Find Channel"
                  )}
                </Button>
              )}
            </div>

            {/* Channel Preview */}
            {validatedChannel && (
              <div className="border rounded-lg p-4 space-y-4">
                
                <div className="flex items-start gap-4">
                  {validatedChannel.thumbnailUrl && (
                    <Image
                      src={validatedChannel.thumbnailUrl}
                      alt={validatedChannel.channelTitle}
                      className="w-16 h-16 rounded-full object-cover"
                      width={64}
                      height={64}
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <div>
                      <h5 className="font-medium text-lg">{validatedChannel.channelTitle}</h5>
                      {validatedChannel.channelHandle && (
                        <p className="text-muted-foreground">{validatedChannel.channelHandle}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {validatedChannel.subscriberCount && (
                        <span>{formatSubscriberCount(validatedChannel.subscriberCount)} subscribers</span>
                      )}
                      {validatedChannel.videoCount && (
                        <span>{parseInt(validatedChannel.videoCount).toLocaleString()} videos</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Channel ID: {validatedChannel.channelId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1"
                        onClick={() => {
                          const url = `https://youtube.com/channel/${validatedChannel.channelId}`
                          window.open(url, '_blank', 'noopener,noreferrer')
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setValidatedChannel(null)
                      setChannelInput("")
                    }}
                    className="flex-1"
                  >
                    Try Different Channel
                  </Button>
                  <Button 
                    onClick={connectChannel} 
                    disabled={isConnecting} 
                    className="flex-1 bg-gradient-primary text-white hover:bg-gradient-primary/90"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect This Channel"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="hidden" />
      </DialogContent>
    </Dialog>
  )
}
