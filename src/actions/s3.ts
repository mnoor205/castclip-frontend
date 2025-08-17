"use server"

import { PutObjectCommand, S3Client, DeleteObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3"
import { getUserData } from "./user"
import { v4 as uuidv4 } from "uuid"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { prismaDB } from "@/lib/prisma"

export async function generateUploadUrl(fileInfo: {
    fileName: string, contentType: string, clipCount: number, captionStyle: number
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
    const key = `${user.id}/${uniqueId}/original.${fileExtension}`

    const command = new PutObjectCommand({
        Bucket: "ai-podcast-clipper",
        Key: key,
        ContentType: fileInfo.contentType
    })

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 })

    const uploadedFileDbRecord = await prismaDB.project.create({
        data: {
            id: uniqueId,
            userId: user.id,
            s3Key: key,
            displayName: fileInfo.fileName,
            uploaded: false,
            clipCount: fileInfo.clipCount,
            captionStyle: fileInfo.captionStyle,
            status: "queued",
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

export async function deleteFileFromS3(key: string) {
    const s3Client = new S3Client({
        region: "auto",
        endpoint: process.env.S3_ENDPOINT!,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
        },
    })

    const command = new DeleteObjectCommand({
        Bucket: "ai-podcast-clipper",
        Key: key,
    })

    await s3Client.send(command)
}

export async function deleteFolderFromS3(prefix: string) {
    const s3Client = new S3Client({
        region: "auto",
        endpoint: process.env.S3_ENDPOINT!,
        credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID!,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
        },
    })

    // List all objects with the given prefix
    const listCommand = new ListObjectsV2Command({
        Bucket: "ai-podcast-clipper",
        Prefix: prefix,
    })
    const listedObjects = await s3Client.send(listCommand)

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) return

    // Delete the objects
    const deleteCommand = new DeleteObjectsCommand({
        Bucket: "ai-podcast-clipper",
        Delete: {
            Objects: listedObjects.Contents.map(obj => ({ Key: obj.Key })),
        },
    })
    await s3Client.send(deleteCommand)
}