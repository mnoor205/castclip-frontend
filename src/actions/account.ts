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

export async function disconnectGoogleAccount() {
    try {
        const user = await getUserData()
        if (!user?.id) {
            throw new Error("User not authenticated")
        }

        // Find the Google account for this user
        const googleAccount = await prismaDB.account.findFirst({
            where: {
                userId: user.id,
                providerId: "google",
            },
        })

        if (!googleAccount) {
            throw new Error("No Google account connected")
        }

        // Revoke the token with Google
        if (googleAccount.accessToken) {
            try {
                const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${googleAccount.accessToken}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                })
                
                if (!response.ok) {
                    console.warn(`Google token revocation failed with status: ${response.status}`)
                }
            } catch (error) {
                // Continue even if revocation fails - we still want to delete from our DB
                console.warn("Failed to revoke Google token:", error)
            }
        }

        // Delete the account from our database
        await prismaDB.account.delete({
            where: {
                id: googleAccount.id,
            },
        })

        // Revalidate the page to update the UI
        revalidatePath("/")

        return { success: true }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to disconnect Google account"
        console.error("Failed to disconnect Google account:", {
            error: errorMessage,
            timestamp: new Date().toISOString(),
        })
        throw new Error(errorMessage)
    }
}
