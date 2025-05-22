"use server"

import { inngest } from "@/inngest/client"
import { prismaDB } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function processVideo(uploadedFileId: string, clipCount: number) {
    const uploadedVideo = await prismaDB.uploadedFile.findUniqueOrThrow({
        where: {
            id: uploadedFileId
        },
        select: {
            uploaded: true,
            id: true,
            userId: true
        }
    })

    if (uploadedVideo.uploaded) return

    await inngest.send({
        name: "process-video-events",
        data: { uploadedFileId: uploadedVideo.id, userId: uploadedVideo.userId, clipCount:clipCount }
    })

    await prismaDB.uploadedFile.update({
        where: {
            id: uploadedFileId
        },
        data: {
            uploaded: true
        }
    })

    revalidatePath("/dashboard")
}
