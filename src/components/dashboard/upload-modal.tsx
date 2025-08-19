"use client"

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
import Dropzone from "shadcn-dropzone"
import { Loader2, UploadCloud } from "lucide-react"
import { toast } from "sonner"
import { generateUploadUrl } from "@/actions/s3"
import { processVideo } from "@/actions/generation"
import GenerationOptions from "./generation-options"

export default function UploadModal({
  open,
  onOpenChange,
  credits = 0,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  credits?: number
}) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [clipCount, setClipCount] = useState<number>(1)
  const [captionStyle, setCaptionStyle] = useState<number>(1)

  const handleDrop = (acceptedFiles: File[]) => {
    setFiles(acceptedFiles.slice(0, 1))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    if (credits <= 0) {
      toast("Please purchase credits to generate clips", {
        description: `Current Credits: ${credits}`,
      })
      return
    }

    const file = files[0]!
    setUploading(true)

    try {
      const { success, signedUrl, uploadedFileId } = await generateUploadUrl({
        fileName: file.name,
        contentType: file.type,
        clipCount,
        captionStyle,
      })

      if (!success) throw new Error("Failed to get upload URL")

      const uploadResponse = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })

      if (!uploadResponse.ok) throw new Error(`Upload failed with status: ${uploadResponse.status}`)

      await processVideo(uploadedFileId, clipCount, captionStyle)

      setFiles([])
      toast.success("Video Uploaded Successfully", {
        description:
          "Your video has begun processing, it may take up to 15 minutes. We will send you an email when processing is complete!",
        duration: 8000,
      })
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      let errorDescription = "There was a problem uploading your video. Please try again."
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorDescription =
            "The request timed out. Your video may still be processing. Check the Queue tab in a few minutes."
        } else if (error.message.includes("credits")) {
          errorDescription = "Insufficient credits to process this video."
        } else if (error.message.includes("Database")) {
          errorDescription = "Database connection issue. Please try again in a moment."
        }
      }
      toast.error("Upload Failed", {
        description: errorDescription,
        duration: 8000,
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl md:max-w-5xl lg:max-w-6xl" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Upload & Style Your Podcast</DialogTitle>
          <DialogDescription>Upload your MP4 and choose a caption style for your clips</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 max-h-[80vh] overflow-y-auto p-1 pr-3">
          {/* Dropzone */}
          <div>
            <Dropzone
              onDrop={handleDrop}
              accept={{ "video/mp4": [".mp4"] }}
              maxSize={2000 * 1024 * 1024}
              maxFiles={1}
              disabled={uploading}
            >
              {() => (
                <div className="flex flex-col items-center justify-center space-y-4 rounded-lg p-10 text-center border border-dashed">
                  <UploadCloud className="text-muted-foreground h-12 w-12" />
                  <p className="font-medium">Drag and drop your file</p>
                  <p className="text-muted-foreground text-sm">or click to browse [MP4 up to 2GB]</p>
                  <Button size="sm" disabled={uploading}>
                    Select File
                  </Button>
                </div>
              )}
            </Dropzone>

            {files.length > 0 && (
              <div className="mt-3 space-y-1 text-sm">
                <p className="font-medium">Selected File:</p>
                <p className="text-muted-foreground truncate">{files[0].name}</p>
              </div>
            )}
          </div>

          <GenerationOptions
            captionStyle={captionStyle}
            onCaptionStyleChange={setCaptionStyle}
            clipCount={clipCount}
            onClipCountChange={setClipCount}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={files.length === 0 || uploading} className="bg-gradient-primary text-white hover:bg-gradient-primary/90">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                "Upload and Generate Clips"
              )}
            </Button>
          </div>
        </div>

        <DialogFooter className="hidden" />
      </DialogContent>
    </Dialog>
  )
}
