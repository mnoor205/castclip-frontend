"use server"

import { inngest } from "@/inngest/client"
import { prismaDB } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getUserData } from "./user"
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export async function processVideo(uploadedFileId: string) {
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
        data: { uploadedFileId: uploadedVideo.id, userId: uploadedVideo.userId }
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


export async function getClipPlayUrl(clipId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    const user = await getUserData()
    if (!user?.id) {
        return { success: false, error: "Unauthorized" }
    }

    try {
        const clip = await prismaDB.clip.findUniqueOrThrow({
            where: {
                id: clipId,
                userId: user.id
            }
        })

        const s3Client = new S3Client({
            region: process.env.AWS_REGION,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
            },
        })

        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME!,
            Key: clip.s3Key
        })

        const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 3600
        })

        return { success: true, url: signedUrl }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Failed to generate play URL" }
    }
}