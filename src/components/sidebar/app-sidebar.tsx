"use client"

import { FileText, Home, LogOut } from "lucide-react"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { AuthUserObject } from "@/lib/types"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authClient } from "@/lib/auth-client"
import { useRouter, usePathname } from "next/navigation"
import { SettingsDialog } from "../user/dialog"
import { cn } from "@/lib/utils"

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Projects",
    url: "/projects",
    icon: FileText,
  },
]

export function AppSidebar({ user }: { user: AuthUserObject }) {
  const router = useRouter()
  const pathname = usePathname()

  const handleSignOut = async () => {
    await authClient.signOut()
    router.replace('/')
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="flex flex-col">
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className="flex w-full justify-center mb-6 py-2 h-auto text-gradient-primary text-4xl font-extrabold leading-none">CastClip</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = pathname.startsWith(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      size="lg"
                      className={cn(
                        "[&>svg]:size-5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0",
                        isActive && "bg-gradient-primary text-white opacity-80 hover:text-white"
                      )}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span className="truncate transition-all duration-300 ease-in-out group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg" className="[&>svg]:size-5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
                    <Avatar className="h-8 w-8 border border-border">
                      {user.image && <AvatarImage src={user.image} />}
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="truncate transition-all duration-300 ease-in-out group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0">{user.name}</span>
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuItem asChild>
                    <SettingsDialog user={user} />
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer flex items-center gap-2 py-2.5 px-3 mb-1" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 text-destructive" />
                    <span className="text-sm text-destructive">Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}