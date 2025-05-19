"use client"

import { UserObject } from "@/lib/types"

type Props = {
  user: UserObject
}

export function AccountSettings({ user }: Props) {

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Account Details</h3>
        <p className="text-sm text-muted-foreground">View your account settings and manage your profile.</p>
      </div>

      <div className="flex flex-col space-y-2">
        <div>
          <label htmlFor="id">ID</label>
          <input id="id" placeholder={user.id} />
        </div>

        {/* <div>
          <label htmlFor="name">Name</label>
          <input id="name" placeholder={user.name} />
        </div> */}

        <div>
          <label htmlFor="email">Email</label>
          <input id="email" placeholder={user.email} />
        </div>
      </div>

    </div>
  )
}
