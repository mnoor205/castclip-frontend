"use client"

import { Badge } from "../ui/badge"
import { ArrowRight, ChevronRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import UploadModal from "./upload-modal"
import ChannelModal from "./channel-modal"
import { getYouTubeVideos } from "@/actions/youtube"
import { toast } from "sonner"
import UrlModal from "./url-modal"
import type { YouTubeResponse } from "@/lib/types"

type Project = {
  id: string | number
  thumbnail?: string
  title: string
  status: string
  clips: number
  createdAt?: string
}

const GenerateOptions = [
  {
    title: "Upload a",
    highlightedText: "File",
    description: "Upload an mp4 from your own device to generate clips",
    bgClass: "from-sky-500 to-blue-500",
  },
  {
    title: "Use my",
    highlightedText: "Youtube Channel",
    description: "Connect your YouTube channel and choose from your own videos",
    highlight: true,
    bgClass: "from-pink-500 to-orange-500",
  },
  {
    title: "Enter a Video",
    highlightedText: "URL",
    description: "Provide a YouTube URL to generate clips",
    bgClass: "from-emerald-500 to-green-500",
  },
]

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "processed":
      return "bg-green-500"
    case "processing":
      return "bg-yellow-500"
    case "queued":
      return "bg-blue-500"
    case "no credits":
      return "bg-red-500"
    default:
      return "bg-muted"
  }
}

interface DashboardProps {
  userName: string
  projects?: Project[]
  credits?: number
}

export default function DashboardPage({ userName, projects = [], credits = 0 }: DashboardProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<(typeof GenerateOptions)[number] | null>(null)
  const [youtubeDataCache, setYoutubeDataCache] = useState<YouTubeResponse | null>(null)
  const [isYoutubeLoading, setIsYoutubeLoading] = useState(false)

  const handleOpenYouTubeModal = () => {
    // If we have no data, it's the first load, so show a loader.
    if (!youtubeDataCache) {
      setIsYoutubeLoading(true)
      getYouTubeVideos()
        .then((data) => setYoutubeDataCache(data))
        .catch((err) => toast.error("Failed to get YouTube videos", { description: err.message }))
        .finally(() => setIsYoutubeLoading(false))
    } else {
      // If we do have data, revalidate in the background to get updates.
      getYouTubeVideos().then((data) => setYoutubeDataCache(data))
    }
  }

  const handleOpenOption = (opt: (typeof GenerateOptions)[number]) => {
    setSelected(opt)
    setOpen(true)
    if (opt.highlightedText === "Youtube Channel") {
      handleOpenYouTubeModal()
    }
  }

  const handleYouTubeSuccess = () => {
    // Refresh YouTube data after successful connection
    handleOpenYouTubeModal()
  }

  return (
    <div className="w-full">
      {/* Top Greeting */}
      <div className="flex flex-col items-center justify-center mb-6 sm:mb-8 md:mb-12 gap-3 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-bold leading-tight px-2">
          Hi {userName}, how would you like to get started?
        </h1>
      </div>

      {/* Main Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10 max-w-4xl mx-auto">
        {GenerateOptions.map((option) => (
          <div
            key={option.title}
            onClick={() => handleOpenOption(option)}
            className={`hover:shadow-2xl hover:shadow-black/20 hover:scale-105 hover:brightness-110 transition-all duration-300 ease-out cursor-pointer group rounded-xl p-4 flex flex-col gap-2 items-start justify-start min-h-[140px] sm:min-h-[160px] lg:min-h-[200px] bg-gradient-to-br ${option.bgClass} text-white transform-gpu w-full`}
          >
            <div className="flex flex-col w-full">
              <span className="text-base sm:text-lg font-bold leading-tight">{option.title}</span>
              <span className="text-xl lg:text-3xl font-semibold leading-tight mt-1">{option.highlightedText}</span>
            </div>
            <div className="text-sm text-white font-medium leading-relaxed">{option.description}</div>
          </div>
        ))}
      </div>

      {/* Recent Projects */}
      <div className="w-full max-w-4xl mx-auto">
        <Link href="/projects" className="flex items-center gap-2 mb-4 group w-fit">
          <h2 className="text-xl sm:text-2xl font-semibold group-hover:underline">Your Recent Projects</h2>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" aria-hidden="true" />
        </Link>
        <div className="space-y-3">
          {projects.slice(0, 4).map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center gap-3 p-3 sm:p-4 bg-card/70 border border-border cursor-pointer transition-all duration-200 ease-out hover:shadow-xl hover:bg-muted/40 rounded-xl w-full"
            >
              {project.thumbnail && (
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                  <Image
                    src={project.thumbnail}
                    alt="thumbnail"
                    width={64}
                    height={64}
                    sizes="64px"
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate text-base sm:text-lg">{project.title}</div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge className={`text-white text-xs ${getStatusColor(project.status)}`}>{project.status}</Badge>
                  {project.createdAt && <span>• {new Date(project.createdAt).toLocaleDateString()}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm sm:text-base font-bold flex-shrink-0">
                {project.clips}
                <ArrowRight className="h-4 w-4 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Modal routing */}
      {selected?.highlightedText === "File" ? (
        <UploadModal open={open} onOpenChange={setOpen} credits={credits} />
      ) : selected?.highlightedText === "Youtube Channel" ? (
        <ChannelModal
          open={open}
          onOpenChange={setOpen}
          initialData={youtubeDataCache}
          isLoading={isYoutubeLoading}
          onDataNeedsRefresh={handleYouTubeSuccess}
        />
      ) : selected?.highlightedText === "URL" ? (
        <UrlModal open={open} onOpenChange={setOpen} />
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-4xl md:max-w-5xl lg:max-w-6xl">
            <DialogHeader>
              <DialogTitle>{selected ? `${selected.title} ${selected.highlightedText}` : "Get Started"}</DialogTitle>
              {selected && <DialogDescription>{selected.description}</DialogDescription>}
            </DialogHeader>
            <div className="text-sm text-muted-foreground">This flow will be implemented next.</div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button onClick={() => setOpen(false)}>Continue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
