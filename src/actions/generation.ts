"use server"

import { inngest } from "@/inngest/client"
import { prismaDB } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getUserData } from "./user"

export async function processVideo(projectId: string, clipCount: number, captionStyle: number) {
    try {
        // Add timeout to database operations
        const project = await Promise.race([
            prismaDB.project.findUniqueOrThrow({
                where: {
                    id: projectId
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

        if (project.uploaded) return

        // Add timeout to Inngest event sending
        await Promise.race([
            inngest.send({
                name: "process-video-events",
                data: { projectId: project.id, clipCount: clipCount, captionStyle: captionStyle }
            }),
            new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Inngest send timeout')), 8000)
            )
        ])

        // Add timeout to database update
        await Promise.race([
            prismaDB.project.update({
                where: {
                    id: projectId
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

export async function createProjectFromUrl({
    videoUrl,
    title,
    thumbnailUrl,
    clipCount,
    captionStyle,
}: {
    videoUrl: string
    title: string
    thumbnailUrl: string
    clipCount: number
    captionStyle: number
}) {
    const user = await getUserData()

    if (!user?.id) {
        throw new Error("User not authenticated")
    }

    const project = await prismaDB.project.create({
        data: {
            user: { connect: { id: user.id } },
            source: "VIDEO_URL",
            externalUrl: videoUrl,
            displayName: title,
            thumbnailUrl: thumbnailUrl,
            clipCount,
            captionStyle,
        },
    })

    await processVideo(project.id, clipCount, captionStyle)

    revalidatePath("/dashboard")

    return { projectId: project.id }
}
