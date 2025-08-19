"use server"

import { prismaDB } from "@/lib/prisma"
import { getUserData } from "./user"
import { revalidatePath } from "next/cache"

export async function getConnectedAccounts() {
    const user = await getUserData()
    if (!user?.id) return []

    const accounts = await prismaDB.account.findMany({
        where: { userId: user.id },
        select: { providerId: true },
    })

    return accounts.map(acc => acc.providerId)
}

export async function disconnectYouTubeChannel() {
    try {
        const user = await getUserData()
        if (!user?.id) {
            throw new Error("User not authenticated")
        }

        // Update the user record to remove YouTube channel connection with timeout
        await Promise.race([
            prismaDB.user.update({
                where: { id: user.id },
                data: {
                    youtubeChannelId: null,
                    youtubeChannelTitle: null,
                },
            }),
            new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Database update timeout')), 5000)
            )
        ])

        // Revalidate the page to update the UI
        revalidatePath("/")

        return { success: true }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to disconnect YouTube channel"
        console.error("Failed to disconnect YouTube channel:", {
            error: errorMessage,
            timestamp: new Date().toISOString(),
        })
        throw new Error(errorMessage)
    }
}
