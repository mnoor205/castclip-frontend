import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { getUserData } from "@/actions/user";
import { PanelLeft } from "lucide-react";
import GuideSidebar from "@/components/navigation/guide-sidebar";
import Navbar from "@/components/navigation/navbar";


export default async function GuidesLayout({ children }: { children: React.ReactNode }) {
    const user = await getUserData();


  return (
    <div className="flex flex-col bg-white min-h-screen">
      <Navbar
        user={user}
        leftSlot={
          <Sheet>
            <SheetTrigger asChild>
              <PanelLeft className="size-5 cursor-pointer" />
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 sm:w-80 border-r h-full" aria-label="Guide menu">
              <SheetTitle className="sr-only">Guide menu</SheetTitle>
              <GuideSidebar inSheet />
            </SheetContent>
          </Sheet>
        }
      />
      <div className="flex flex-1">
        <div className="hidden md:block">
          <GuideSidebar />
        </div>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>

  );
}
