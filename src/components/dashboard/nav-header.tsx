"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { UserObject } from "@/lib/types";
import UserButton from "../user/button";
import { Coins, Plus } from "lucide-react";

const NavHeader = ( user : UserObject ) => {
  return (
    <header className="bg-gradient-to-r from-pink-50/50 via-white to-orange-50/50 backdrop-blur-sm sticky top-0 z-10 flex justify-center border-b border-border/20 shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4 py-2">
        <Link href="/dashboard" className="flex items-center">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <span className="text-gradient-primary">CastClip</span>
        </div>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm p-1 shadow-md rounded-lg border border-white/20">
            <div className="flex items-center gap-2 px-3">
              <Coins className="h-5 w-5 text-yellow-400" />
              <span className="font-semibold text-sm text-gray-700">{user.credits} Credits</span>
            </div>

            <Link href="/dashboard/billing">
              <Button 
                size="sm"
                className="bg-gradient-primary text-white hover:opacity-90 hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg px-4 py-2 font-medium text-xs h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                Buy Credits
              </Button>
            </Link>
          </div>

          <UserButton user={user} />
        </div>
      </div>
    </header>
  );
};

export default NavHeader;

