import { getUserData } from "@/actions/user"
import DashboardPage from "@/components/dashboard"
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
            projects: {
                where: {
                    uploaded: true
                },
                orderBy: {
                    createdAt: "desc"
                },
                 select: {
                    id: true,
                    s3Key: true,
                    displayName: true,
                    status: true,
                    createdAt: true,
                    thumbnailUrl: true,
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

    const formattedFiles = userData.projects.map((project) => ({
        id: project.id,
        thumbnail: project.thumbnailUrl ?? undefined,
        title: project.displayName || "Unknown filename",
        status: project.status.charAt(0).toUpperCase() + project.status.slice(1),
        clips: project._count.Clip,
        createdAt: project.createdAt.toISOString(),
    }))

    return <DashboardPage userName={user.name} projects={formattedFiles} credits={userData.credits} />
}