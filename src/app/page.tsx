import { DashboardFrame } from "@/components/landing/frame";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen py-16 px-6">

       <header className="flex justify-between items-center px-6 md:px-12 my-4 sticky">
          <div className="flex items-center gap-2 text-xl font-semibold">
            CastClip
          </div>
          {/* <nav className="hidden md:flex gap-6 text-sm font-medium">
            <Link href="#features">Features</Link>
            <Link href="#pricing">Pricing</Link>
            <Link href="#contact">Contact</Link>
          </nav> */}
          <div className="flex items-center gap-4">
            <Link href="sign-in">
            <Button variant="secondary" className="text-sm font-semibold">
              Sign In
            </Button>
            </Link>
          </div>
        </header>

      <section className="text-center ">
        <h1 className="text-5xl md:text-7xl font-bold">
          Create Clips From Your
          <br />
          Podcasts <span className="">Instantly</span>
        </h1>
        <p className="mt-6 max-w-xl mx-auto">
          With our state of the art algorithm, create clips designed to go viral
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Button variant="default" className="text-sm font-semibold">
            Get Started Free 
            <ArrowRight className="font-semibold"/>
          </Button>
        </div>
      </section>

      {/* Dashboard Preview (Placeholder) */}
        <div className="max-w-6xl mx-auto my-4">
        <DashboardFrame>
        <Image
          src="/preview.png"
          alt="Dashboard"
          width={2211}
          height={1150}
          className="w-full"
        />
      </DashboardFrame>
      </div>
    </main>
  );
}
