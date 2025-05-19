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
import { useState } from "react"
import { Button } from "@/components/ui/button" 
import { User, CreditCard } from "lucide-react"
import { UserObject } from "@/lib/types"
import { BillingSettings } from "./billing"
import { AccountSettings } from "./account"

type SettingsTab = "account" | "billing"

export function SettingsDialog({ user }: { user: UserObject}) {
    const [activeTab, setActiveTab] = useState<SettingsTab>("account")

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
                            className="justify-start"
                            onClick={() => setActiveTab("account")}
                        >
                            <User className="mr-2 h-4 w-4" />
                            Account
                        </Button>
                        <Button
                            variant={activeTab === "billing" ? "default" : "ghost"}
                            className="justify-start"
                            onClick={() => setActiveTab("billing")}
                        >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Billing
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto h-[500px] pr-2">
                        {activeTab === "account" && <AccountSettings user={user} />}
                        {activeTab === "billing" && <BillingSettings user={user}/>}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}