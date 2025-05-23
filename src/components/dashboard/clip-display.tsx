"use client"
import type { Clip as PrismaClip } from "@prisma/client"
import { Download, Youtube } from "lucide-react"
import { useEffect, useRef } from "react"
import { Button } from "../ui/button"
import Link from "next/link"

interface Clip extends PrismaClip {
    youtubeUrl?: string;
}

function ClipCard({ clip }: { clip: Clip }) {
    const videoRef = useRef<HTMLVideoElement | null>(null)

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


    return (
        <div className="flex max-w-52 flex-col gap-2">
            <div className="bg-muted">
                <video
                    src={`https://castclip.revolt-ai.com/${clip.s3Key}`}
                    controls
                    preload="metadata"
                    className="h-full w-full rounded-md object-cover"
                />
            </div>
            {clip.youtubeUrl ? (
                <Link className="flex flex-col gap-2" href={clip.youtubeUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                        <Youtube className="mr-1.5 h-4 w-4" />
                        Watch Original
                    </Button>
                </Link>
            ) : (
                <Link className="flex flex-col gap-2" href={`https://castclip.revolt-ai.com/${clip.s3Key}`}>
                    <Button variant="outline" size="sm">
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