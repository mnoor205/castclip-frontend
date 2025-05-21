"use client"
import type { Clip } from "@prisma/client"
import { Download } from "lucide-react"
import { useEffect, useRef } from "react"
import { Button } from "../ui/button"
import Link from "next/link"

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
            <div className="relative w-full aspect-[9/16] overflow-hidden rounded-md bg-black">
                <video
                    ref={videoRef}
                    src={`https://castclip.revolt-ai.com/${clip.s3Key}`}
                    controls
                    preload="metadata"
                    className="h-full w-full object-cover"
                />
            </div>
            <Link className="flex flex-col gap-2" href={`https://castclip.revolt-ai.com/${clip.s3Key}`}>
                <Button variant="outline" size="sm">
                    <Download className="mr-1.5 h-4 w-4" />
                    Download
                </Button>
            </Link>
        </div>
    )
}


export function ClipDisplay({ clips }: { clips: Clip[] }) {
    if (clips.length === 0) {
        return <p className="text-muted-foreground p-4 text-center">No Clips Generated</p>
    }

    return (
        <div className="grid gird-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {clips.map((clip) => (
                <ClipCard key={clip.id} clip={clip} />
            ))}
        </div>
    )
}