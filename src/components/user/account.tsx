"use client"

import { UserObject } from "@/lib/types"
import { Button } from "../ui/button"
import { useState } from "react"
import { toast } from "sonner"
import { disconnectYouTubeChannel } from "@/actions/account"
import { Loader2 } from "lucide-react"

type Props = {
  user: UserObject
}

export function AccountSettings({ user }: Props) {
  const [isYouTubeConnected, setIsYouTubeConnected] = useState(!!user.youtubeChannelId)
  const [isDisconnectingYouTube, setIsDisconnectingYouTube] = useState(false)

  const handleDisconnectYouTube = async () => {
    setIsDisconnectingYouTube(true)
    try {
      await disconnectYouTubeChannel()
      setIsYouTubeConnected(false)
      toast.success("Successfully disconnected your YouTube channel")
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to disconnect YouTube channel"
      toast.error("Failed to disconnect", { description: message })
    } finally {
      setIsDisconnectingYouTube(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium">Account Details</h3>
        <p className="text-sm text-muted-foreground">View and manage your account settings.</p>
        <div className="mt-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Name:</span>
            <span>{user.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Email:</span>
            <span>{user.email}</span>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium">Connected Accounts</h3>
        <p className="text-sm text-muted-foreground">Manage your connected social accounts.</p>

        {/* YouTube Channel Section */}
        <div className="mt-4 flex items-center justify-between rounded-md border p-4">
          <div className="flex items-center gap-4">
            <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </div>
            <div>
              <span className="font-medium">YouTube Channel</span>
              <p className="text-sm text-muted-foreground">
                {isYouTubeConnected 
                  ? `Connected: ${user.youtubeChannelTitle || 'Your Channel'}` 
                  : "Not Connected"
                }
              </p>
            </div>
          </div>
          {isYouTubeConnected ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDisconnectYouTube}
              disabled={isDisconnectingYouTube}
            >
              {isDisconnectingYouTube ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                "Disconnect"
              )}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              disabled
            >
              Connect on Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
