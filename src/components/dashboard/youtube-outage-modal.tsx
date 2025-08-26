"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ExternalLink } from "lucide-react"

interface YouTubeOutageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function YouTubeOutageModal({ open, onOpenChange }: YouTubeOutageModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-yellow-600" />
          </div>
          <DialogTitle className="text-xl">YouTube Processing Temporarily Down</DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            YouTube made some changes that messed up our system. We&apos;re working on a fix!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-3">
              For now, you can download YouTube videos manually:
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open('https://ssvid.net/en', '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Use ssvid.net downloader
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Then upload the file directly using our upload option.
          </div>
        </div>

        <DialogFooter>
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full bg-gradient-primary text-white"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
