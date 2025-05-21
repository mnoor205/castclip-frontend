"use server"

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getUserData } from "./user"
import { v4 as uuidv4 } from "uuid"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { prismaDB } from "@/lib/prisma"

export async function generateUploadUrl(fileInfo: {
    fileName: string, contentType: string
}): Promise<{ success: boolean, signedUrl: string, key: string, uploadedFileId: string }> {

    const user = await getUserData()

    if (!user) throw new Error("Unauthorized")

    const s3Client = new S3Client({
    region: "auto",
    endpoint: process.env.S3_ENDPOINT!,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
    },
})

    const fileExtension = fileInfo.fileName.split(".").pop() || ""

    const uniqueId = uuidv4()
    const key = `${uniqueId}/original.${fileExtension}`

    const command = new PutObjectCommand({
        Bucket: "ai-podcast-clipper",
        Key: key,
        ContentType: fileInfo.contentType
    })

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 })

    const uploadedFileDbRecord = await prismaDB.uploadedFile.create({
        data: {
            userId: user.id,
            s3Key: key,
            displayName: fileInfo.fileName,
            uploaded: false
        },
        select: {
            id: true
        }
    })

    return {
        success: true,
        signedUrl,
        key,
        uploadedFileId: uploadedFileDbRecord.id
    }
}