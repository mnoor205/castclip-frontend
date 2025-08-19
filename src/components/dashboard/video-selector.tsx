"use client"

import { useMemo } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import type { Video, VideoSelectorData } from "@/lib/types"

interface VideoSelectorProps {
  videos: Video[]
  selectedVideo: Video | null
  onSelectVideo: (video: Video) => void
  searchQuery: string
  onSearchQueryChange: (query: string) => void
  isSearching?: boolean
  searchedVideos?: VideoSelectorData | null
  hasMoreToLoad?: boolean
  onLoadMore?: () => void
  loadingMore?: boolean
  emptyMessage?: string
  searchPlaceholder?: string
}

export default function VideoSelector({
  videos,
  selectedVideo,
  onSelectVideo,
  searchQuery,
  onSearchQueryChange,
  isSearching = false,
  searchedVideos = null,
  hasMoreToLoad = false,
  onLoadMore,
  loadingMore = false,
  emptyMessage = "No videos found.",
  searchPlaceholder = "Search videos...",
}: VideoSelectorProps) {
  const locallyFilteredVideos = useMemo(() => {
    if (!searchQuery) return videos
    return videos.filter((v) => v.title.toLowerCase().includes(searchQuery.toLowerCase()))
  }, [searchQuery, videos])

  const videosToDisplay = useMemo(() => {
    if (!searchQuery) {
      return videos
    }
    // Combine local results with backend search results
    const combined = [...locallyFilteredVideos, ...(searchedVideos?.videos ?? [])]
    // Deduplicate the list
    return Array.from(new Map(combined.map((v) => [v.id, v])).values())
  }, [searchQuery, videos, searchedVideos, locallyFilteredVideos])

  return (
    <div>
      <div className="px-4 relative mb-4">
        <Input
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
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
                onClick={() => onSelectVideo(video)}
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
          {hasMoreToLoad && onLoadMore && (
            <div className="flex-shrink-0 w-48 sm:w-60 flex items-center justify-center">
              <Button
                onClick={onLoadMore}
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
            ? emptyMessage
            : ""}
        </p>
      )}
    </div>
  )
}
