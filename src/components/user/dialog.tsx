"use client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog" 
import { Settings } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button" 
import { User, CreditCard } from "lucide-react"
import { AuthUserObject } from "@/lib/types"
import { BillingSettings } from "./billing"
import { AccountSettings } from "./account"
import { getConnectedAccounts } from "@/actions/account"
import { getUserYouTubeChannel } from "@/actions/youtube"

type SettingsTab = "account" | "billing"

export function SettingsDialog({ user }: { user: AuthUserObject}) {
    const [activeTab, setActiveTab] = useState<SettingsTab>("account")
    const [connectedAccounts, setConnectedAccounts] = useState<string[]>([])
    const [youtubeChannel, setYoutubeChannel] = useState<{channelId: string; channelTitle: string} | null>(null)

    useEffect(() => {
        Promise.all([
            getConnectedAccounts(),
            getUserYouTubeChannel()
        ]).then(([accounts, channel]) => {
            setConnectedAccounts(accounts)
            setYoutubeChannel(channel)
        })
    }, [])

    const enrichedUser = {
        ...user,
        connectedAccounts,
        youtubeChannelId: youtubeChannel?.channelId || null,
        youtubeChannelTitle: youtubeChannel?.channelTitle || null,
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="w-full cursor-pointer flex items-center gap-2 py-2.5 px-3 mb-1 hover:bg-muted rounded-md">
                    <Settings className="h-4 w-4" />
                    <span className="text-sm">Settings</span>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[850px] h-[650px]" onInteractOutside={(e) => {e.preventDefault()}}>
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>Manage your account settings and billing preferences.</DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-4 md:flex-row">
                    {/* Sidebar */}
                    <div className="flex flex-col gap-1 border-b pb-4 md:w-[200px] md:border-b-0 md:border-r md:pb-0 md:pr-4">
                        <Button
                            variant={activeTab === "account" ? "default" : "ghost"}
                            className={`justify-start ${
                                activeTab === "account" 
                                    ? "bg-gradient-primary text-white border-0 hover:opacity-90" 
                                    : "bg-transparent hover:bg-muted"
                            }`}
                            onClick={() => setActiveTab("account")}
                        >
                            <User className="mr-2 h-4 w-4" />
                            Account
                        </Button>
                        <Button
                            variant={activeTab === "billing" ? "default" : "ghost"}
                            className={`justify-start ${
                                activeTab === "billing" 
                                    ? "bg-gradient-primary text-white border-0 hover:opacity-90" 
                                    : "bg-transparent hover:bg-muted"
                            }`}
                            onClick={() => setActiveTab("billing")}
                        >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Billing
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto h-[500px] pr-2">
                        {activeTab === "account" && <AccountSettings user={enrichedUser} />}
                        {activeTab === "billing" && <BillingSettings user={enrichedUser}/>}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}