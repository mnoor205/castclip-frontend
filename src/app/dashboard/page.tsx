import { getUserData } from "@/actions/user"
import DashboardPage from "@/components/dashboard/dashboard-page"
import { prismaDB } from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function Dashboard() {
    const user = await getUserData()

    if (!user || !user.id) {
        redirect('/sign-in')
    }


    const userData = await prismaDB.user.findUniqueOrThrow({
        where: { id: user.id },
        select: {
            credits: true,
            UploadedFile: {
                where: {
                    uploaded: true
                },
                 select: {
                    id: true,
                    s3Key: true,
                    displayName: true,
                    status: true,
                    createdAt: true,
                    _count: {
                        select: {
                            Clip: true
                        }
                    }
                 }
            },
            clips: {
                orderBy: {
                    createdAt: "desc"
                }
            }
        }
    })

    const formattedFiles = userData.UploadedFile.map((file) => ({
        id: file.id,
        s3Key: file.s3Key,
        fileName: file.displayName || "Unknown filename",
        status: file.status,
        clipsCount: file._count.Clip,
        createdAt: file.createdAt
    }))

    return <DashboardPage uploadedFiles={formattedFiles} clips={userData.clips} credits={userData.credits} />
}