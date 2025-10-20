import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { AuthUserObject } from "@/lib/types";

type NavbarProps = {
  user?: AuthUserObject;
  leftSlot?: React.ReactNode;
};

export default function Navbar({ user, leftSlot }: NavbarProps) {
  return (
    <header className="w-full flex justify-between items-center px-4 sm:px-6 md:px-12 py-3 sticky top-0 bg-transparent backdrop-blur-md z-50 border-b border-white/20 shadow-sm">
      <div className="flex items-center gap-3">
        {leftSlot ? <div className="md:hidden">{leftSlot}</div> : null}
        <Link href='/' className="text-xl font-bold text-gradient-primary">CastClip</Link>
      </div>
      <nav className="hidden md:flex gap-8 text-sm font-medium">
        <Link href="/#features" className="hover:text-primary transition-colors">Features</Link>
        <Link href="/#demo" className="hover:text-primary transition-colors">Demo</Link>
        <Link href="/#pricing" className="hover:text-primary transition-colors">Pricing</Link>
        <Link href="/#faq" className="hover:text-primary transition-colors">FAQ</Link>
        {/* <Link href="/guide" className="text-primary text-md transition-colors font-bold">FREE GUIDE</Link> */}
      </nav>
      <div className="flex items-center gap-3">
  {/* Mobile menu trigger (hamburger) */}
  <div className="md:hidden flex items-center justify-center">
    <Sheet>
      <SheetTrigger aria-label="Open navigation">
        <Menu className="w-6 h-6" />
      </SheetTrigger>
      <SheetContent side="right" className="w-72 sm:w-80" aria-label="Site navigation">
        <SheetTitle className="sr-only">Site navigation</SheetTitle>
        <nav className="flex flex-col p-6 gap-6 text-lg font-medium">
          <Link href="/#features" className="hover:text-primary transition-colors">Features</Link>
          <Link href="/#demo" className="hover:text-primary transition-colors">Demo</Link>
          <Link href="/#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          <Link href="/#faq" className="hover:text-primary transition-colors">FAQ</Link>
          {/* <Link href="/guide" className="hover:text-primary transition-colors">FREE GUIDE</Link> */}
        </nav>
        <div className="p-6 pt-0 grid grid-cols-2 gap-3">
          {user ? (
            <Link href="/dashboard" className="col-span-2">
              <Button variant="outline" className="w-full font-medium">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="outline" className="w-full font-medium">Sign In</Button>
              </Link>
              <Link href="/sign-in">
                <Button className="w-full font-medium bg-gradient-primary hover:opacity-90 text-white border-0">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  </div>

  {/* Desktop buttons (hidden on small screens) */}
  <div className="hidden md:flex items-center gap-3">
    {user ? (
      <Link href="/dashboard">
        <Button variant="outline" className="font-medium px-4 py-2">
          Dashboard
        </Button>
      </Link>
    ) : (
      <>
        <Link href="/sign-in">
          <Button variant="ghost" className="font-medium px-3 py-2 text-sm">
            Sign In
          </Button>
        </Link>
        <Link href="/sign-in">
          <Button className="font-medium px-4 py-2 bg-gradient-primary hover:opacity-90 text-white border-0 text-sm">
            Get Started
          </Button>
        </Link>
      </>
    )}
  </div>
</div>
    </header>
  );
}


