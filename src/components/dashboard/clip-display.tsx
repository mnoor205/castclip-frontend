/* eslint-disable  @typescript-eslint/no-explicit-any */

"use client"
import type { Clip as PrismaClip } from "@prisma/client"
import { Download, Youtube } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "../ui/button"
import Link from "next/link"

// Extend PrismaClip to optionally include youtubeUrl for demo purposes
interface Clip extends PrismaClip {
    youtubeUrl?: string;
}

const videoBlobCache = new Map<string, Blob>()

function ClipCard({ clip }: { clip: Clip }) {
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const [videoSrc, setVideoSrc] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const handleFullscreenChange = () => {
            const video = videoRef.current
            if (!video) return

            if (document.fullscreenElement === video) {
                // Rare case if video itself goes fullscreen
                video.style.objectFit = "contain"
            } else if (
                document.fullscreenElement &&
                document.fullscreenElement.contains(video)
            ) {
                video.style.objectFit = "contain"
            } else {
                video.style.objectFit = "cover"
            }
        }

        document.addEventListener("fullscreenchange", handleFullscreenChange)
        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange)
        }
    }, [])

    useEffect(() => {
        let objectUrl: string | null = null
        let isMounted = true
        setIsLoading(true)
        setError(null)

        const loadVideo = async () => {
            if (!clip.s3Key) {
                setError("No video source key provided.")
                setIsLoading(false)
                return
            }

            const r2Url = `/api/video-proxy/${clip.s3Key}`

            if (videoBlobCache.has(clip.s3Key)) {
                const blob = videoBlobCache.get(clip.s3Key)!
                objectUrl = URL.createObjectURL(blob)
                if (isMounted) {
                    setVideoSrc(objectUrl)
                    setIsLoading(false)
                }
            } else {
                try {
                    const response = await fetch(r2Url)
                    if (!response.ok) {
                        throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`)
                    }
                    const blob = await response.blob()
                    videoBlobCache.set(clip.s3Key, blob)
                    objectUrl = URL.createObjectURL(blob)
                    if (isMounted) {
                        setVideoSrc(objectUrl)
                    }
                } catch (e: any) {
                    console.error("Error fetching video:", e)
                    if (isMounted) {
                        setError(e.message || "Failed to load video.")
                    }
                } finally {
                    if (isMounted) {
                        setIsLoading(false)
                    }
                }
            }
        }

        loadVideo()

        return () => {
            isMounted = false
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl)
            }
        }
    }, [clip.s3Key])


    return (
        <div className="flex max-w-52 flex-col gap-2">
            <div className="relative w-full aspect-[9/16] overflow-hidden rounded-md bg-black">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                        Loading...
                    </div>
                )}
                {error && (
                    <div className="absolute inset-0 flex items-center justify-center text-red-500 p-2 text-center text-xs">
                        {error}
                    </div>
                )}
                {!isLoading && !error && videoSrc && (
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        controls
                        preload="metadata"
                        className="h-full w-full object-cover"
                    />
                )}
                 {!isLoading && !error && !videoSrc && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                        No video to display.
                    </div>
                )}
            </div>
            {clip.youtubeUrl ? (
                <Link className="flex flex-col gap-2" href={clip.youtubeUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                        <Youtube className="mr-1.5 h-4 w-4" />
                        Watch Original
                    </Button>
                </Link>
            ) : (
                <Link className="flex flex-col gap-2" href={`/api/video-proxy/${clip.s3Key}`} rel="noopener noreferrer">
                    <Button variant="outline" size="sm" disabled={!clip.s3Key || isLoading || !!error}>
                        <Download className="mr-1.5 h-4 w-4" />
                        Download
                    </Button>
                </Link>
            )}
        </div>
    )
}


export function ClipDisplay({ clips }: { clips: Clip[] }) {
    const sortedClips = [...clips].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (sortedClips.length === 0) {
        return <p className="text-muted-foreground p-4 text-center">No Clips Generated</p>
    }

    return (
        <div className="grid grid-cols-1 gap-4 place-items-center sm:grid-cols-2 sm:place-items-stretch md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
            {sortedClips.map((clip) => (
                <ClipCard key={clip.id} clip={clip} />
            ))}
        </div>
    )
}