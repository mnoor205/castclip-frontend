"use server"

import { inngest } from "@/inngest/client"
import { prismaDB } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function processVideo(uploadedFileId: string, clipCount: number, captionStyle: number) {
    try {
        // Add timeout to database operations
        const uploadedVideo = await Promise.race([
            prismaDB.uploadedFile.findUniqueOrThrow({
                where: {
                    id: uploadedFileId
                },
                select: {
                    uploaded: true,
                    id: true,
                    userId: true
                }
            }),
            new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Database query timeout')), 5000)
            )
        ]) as {
            uploaded: boolean;
            id: string;
            userId: string;
        }

        if (uploadedVideo.uploaded) return

        // Add timeout to Inngest event sending
        await Promise.race([
            inngest.send({
                name: "process-video-events",
                data: { uploadedFileId: uploadedVideo.id, clipCount: clipCount, captionStyle: captionStyle }
            }),
            new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Inngest send timeout')), 8000)
            )
        ])

        // Add timeout to database update
        await Promise.race([
            prismaDB.uploadedFile.update({
                where: {
                    id: uploadedFileId
                },
                data: {
                    uploaded: true
                }
            }),
            new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Database update timeout')), 3000)
            )
        ])

        revalidatePath("/dashboard")
    } catch (error) {
        console.error("ProcessVideo action failed:", error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        throw new Error(`Processing failed: ${errorMessage}`)
    }
}
