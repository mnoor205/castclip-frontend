"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { UserObject } from "@/lib/types";
import UserButton from "../user/button";

const NavHeader = ( user : UserObject ) => {
  return (
    <header className="bg-background sticky top-0 z-10 flex justify-center border-b">
      <div className="container flex h-16 items-center justify-between px-4 py-2">
        <Link href="/dashboard" className="flex items-center">
        <div className="flex items-center gap-2 text-xl font-semibold">
          CastClip
        </div>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="h-8 px-3 py-1.5 text-xs font-medium"
            >
              {user.credits} credits
            </Badge>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8 text-xs font-medium"
            >
              <Link href="/dashboard/billing">Buy more</Link>
            </Button>
          </div>

          <UserButton user={user} />
        </div>
      </div>
    </header>
  );
};

export default NavHeader;

