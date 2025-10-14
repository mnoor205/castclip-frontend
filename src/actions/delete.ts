"use server"

import { prismaDB } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { deleteFileFromS3, deleteFolderFromS3 } from "./s3"
import { getUserData } from "./user"
import { redirect } from "next/navigation"

export async function deleteClip(clipId: string) {
    const user = await getUserData()
    if (!user) throw new Error("Unauthorized")

    const clip = await prismaDB.clip.findUnique({
        where: { id: clipId, userId: user.id },
        select: { s3Key: true, project: { select: { id: true } } }
    })

    if (!clip) throw new Error("Clip not found")

    if (clip.s3Key) {
        await deleteFileFromS3(clip.s3Key)
    }
    await prismaDB.clip.delete({ where: { id: clipId } })

    revalidatePath(`/projects/${clip.project?.id}`)
}

export async function deleteProject(projectId: string) {
    const user = await getUserData()
    if (!user) throw new Error("Unauthorized")

    const project = await prismaDB.project.findUnique({
        where: { id: projectId, userId: user.id },
        include: { Clip: { select: { s3Key: true } } }
    })

    if (!project) throw new Error("Project not found")

    const projectPrefix = `${user.id}/${projectId}`
    await deleteFolderFromS3(projectPrefix)
    
    await prismaDB.project.delete({ where: { id: projectId } })

    revalidatePath("/projects")
    redirect("/projects")
}
