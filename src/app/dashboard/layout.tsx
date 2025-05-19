import { getUserData } from "@/actions/user";
import NavHeader from "@/components/dashboard/nav-header";
import { Toaster } from "@/components/ui/sonner";
import { prismaDB } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function DashboardLayout({
    children,
}: {
    children: ReactNode
}) {
    const user = await getUserData()

    if(!user || !user.id) {
        redirect('/sign-in')
    }

    const userData = await prismaDB.user.findUniqueOrThrow({
        where: { id: user.id},
        select: { credits: true, email: true}
    })

    return (
        <div className="flex min-h-screen flex-col">
            <NavHeader id={user.id} email={userData.email} image={user.image} credits={userData.credits} />
            <main className="container mx-auto flex-1 py-6">
                {children}
            </main>
            <Toaster/>
        </div>
    )
}