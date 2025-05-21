import { getUserData } from "@/actions/user";
import { DashboardFrame } from "@/components/landing/frame";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const user = await getUserData();

  return (
    <main className="min-h-screen">
      <header className="flex justify-between items-center px-4 sm:px-6 md:px-12 py-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2 text-xl font-semibold">
          CastClip
        </div>
        {/* <nav className="hidden md:flex gap-6 text-sm font-medium">
            <Link href="#features">Features</Link>
            <Link href="#pricing">Pricing</Link>
            <Link href="#contact">Contact</Link>
          </nav> */}
        <div className="flex items-center gap-4">
          {user ? (
            <Link href="/dashboard">
              <Button variant="secondary" className="text-sm font-semibold">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="sign-in">
              <Button variant="secondary" className="text-sm font-semibold">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </header>

      <section className="text-center px-4 py-16 sm:py-24 lg:py-16">
        <h1 className="text-5xl sm:text-5xl md:text-6xl lg:text-7xl font-bold">
          Create Clips From Your
          <br />
          Podcasts <span className="">Instantly</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl max-w-xl lg:max-w-2xl mx-auto">
          Use our state of the art algorithm, to generate clips designed to go
          VIRAL
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link href={user ? "/dashboard" : "/sign-in"}>
            <Button variant="default" className="text-base font-semibold inline-flex items-center">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Dashboard Preview (Placeholder) */}
      <div className="max-w-6xl mx-auto my-4 px-4 sm:px-6 lg:px-8">
        <DashboardFrame>
          <Image
            src="/preview.png"
            alt="Dashboard"
            width={2211}
            height={1150}
            className="w-full h-72 object-cover rounded-md sm:h-auto sm:rounded-md"
          />
        </DashboardFrame>
      </div>
    </main>
  );
}
