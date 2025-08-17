import { getUserData } from "@/actions/user";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { prismaDB } from "@/lib/prisma";
import { Coins, Plus } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getUserData();

  if (!user || !user.id) {
    redirect("/sign-in");
  }

  const userData = await prismaDB.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { credits: true, email: true },
  });

  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
 

  return (
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar user={user} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="ml-auto flex items-center gap-2 bg-white/60 backdrop-blur-sm p-1 shadow-md rounded-lg border border-white/20">
              <div className="flex items-center gap-2 px-3">
                <Coins className="h-5 w-5 text-yellow-400" />
                <span className="font-semibold text-sm text-gray-700">{userData.credits} Credits</span>
              </div>
 
              <Link href="/credits">
                <Button 
                  size="sm"
                  className="bg-gradient-primary text-white hover:opacity-90 hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg px-4 py-2 font-medium text-xs h-8"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Buy Credits
                </Button>
              </Link>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            {children}
          </div>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
  );
}
