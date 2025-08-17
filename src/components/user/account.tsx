"use client"

import { UserObject } from "@/lib/types"
import { Button } from "../ui/button"
import Image from "next/image"
import { useState } from "react"
import { toast } from "sonner"
import { disconnectGoogleAccount } from "@/actions/account"
import { Loader2 } from "lucide-react"
import { useGoogleOAuth } from "@/hooks/use-google-oauth"

type Props = {
  user: UserObject
}

export function AccountSettings({ user }: Props) {
  const [isGoogleConnected, setIsGoogleConnected] = useState(user.connectedAccounts?.includes("google") || false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)

  const { isScriptReady, isConnecting, connectGoogle } = useGoogleOAuth({
    onSuccess: () => {
      setIsGoogleConnected(true)
      toast.success("Successfully connected your Google account!")
    },
  })

  const handleDisconnectGoogle = async () => {
    setIsDisconnecting(true)
    try {
      await disconnectGoogleAccount()
      setIsGoogleConnected(false)
      toast.success("Successfully disconnected your Google account")
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to disconnect Google account"
      toast.error("Failed to disconnect", { description: message })
    } finally {
      setIsDisconnecting(false)
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
        <div className="mt-4 flex items-center justify-between rounded-md border p-4">
          <div className="flex items-center gap-4">
            <Image src="/google.svg" alt="Google" width={24} height={24} />
            <div>
              <span className="font-medium">Google</span>
              <p className="text-sm text-muted-foreground">
                {isGoogleConnected ? "Connected to your YouTube channel" : "Not Connected"}
              </p>
            </div>
          </div>
          {isGoogleConnected ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDisconnectGoogle}
              disabled={isDisconnecting}
            >
              {isDisconnecting ? (
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
              onClick={connectGoogle}
              disabled={isConnecting || !isScriptReady}
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : !isScriptReady ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
