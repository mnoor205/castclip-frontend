import { UserObject } from "@/lib/types"

export function BillingSettings({ user }: { user: UserObject}) {
    return (
        <div>
            {user.email + ` 's`} billing
        </div>
    )    
}