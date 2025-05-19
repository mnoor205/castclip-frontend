"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { UserObject } from "@/lib/types"
import { SettingsDialog } from "./dialog"


interface UserButtonProps {
  user: UserObject
//   subscriptionInfo: subscriptionObject | undefined
}

export default function UserButton({ user }: UserButtonProps) {
  const router = useRouter()
//   const pathname = usePathname()

  const handleSignOut = async () => {
    await authClient.signOut()
    router.replace('/')
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
            <Avatar className="h-10 w-10 border border-border">
              {user.image && <AvatarImage src={user.image} />}
              <AvatarFallback>{user.email.charAt(0)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <div className="flex items-center p-3 gap-3 border-b border-b-zinc-400">
            <div className="flex flex-col">
              {/* {user.name && <span className="font-medium text-sm">{user.name}</span>} */}
              <span className="text-sm truncate">{user.email}</span>
            </div>
          </div>

          {/* <Link href={pathname !== "/dashboard" ? '/dashboard' : '/'} passHref legacyBehavior>
            <DropdownMenuItem className="cursor-pointer flex items-center gap-2 py-2.5 px-3 my-1">
              {pathname !== "/dashboard" ? (
                <>
                  <DashboardIcon className="h-4 w-4" />
                  Dashboard
                </>
              ) : (
                <>
                  <Home className="h-4 w-4" />
                  Home
                </>
              )}
            </DropdownMenuItem>
          </Link> */}

          <DropdownMenuItem asChild>
            <SettingsDialog user={user}/>
          </DropdownMenuItem>

          {/* <DropdownMenuItem asChild>
            <PricingModal user={user} subscriptionInfo={subscriptionInfo} />
          </DropdownMenuItem> */}

          <DropdownMenuItem className="cursor-pointer flex items-center gap-2 py-2.5 px-3 mb-1" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">Sign out</span>
          </DropdownMenuItem>

        </DropdownMenuContent>
      </DropdownMenu>

    </>
  )
}
