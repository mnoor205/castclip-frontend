/* eslint-disable  @typescript-eslint/no-explicit-any */
import { getUserData } from "@/actions/user";
import { DashboardFrame } from "@/components/landing/frame";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  UploadCloud,
  Sparkles,
  Download,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { ClipDisplay } from "@/components/dashboard/clip-display";
import BillingPage from "./dashboard/billing/page";

export default async function Home() {
  const user = await getUserData();

  const demoClips = [
    {
      id: "1",
      s3Key: "app/hormozi.mp4",
      title: "Demo Clip 1",
      createdAt: new Date(),
      userId: "demoUser",
      processingStatus: "processed",
      transcript: "",
      customInstructions: "",
      uploadedFileId: "demoFile1",
      youtubeUrl: "https://www.youtube.com/watch?v=-UzJOk85OZI",
    },
    {
      id: "2",
      s3Key: "app/rogan.mp4",
      title: "Demo Clip 2",
      createdAt: new Date(),
      userId: "demoUser",
      processingStatus: "processed",
      transcript: "",
      customInstructions: "",
      uploadedFileId: "demoFile2",
      youtubeUrl: "https://www.youtube.com/watch?v=r63cwSWbFME",
    },
    {
      id: "3",
      s3Key: "app/weekend.mp4",
      title: "Demo Clip 3",
      createdAt: new Date(),
      userId: "demoUser",
      processingStatus: "processed",
      transcript: "",
      customInstructions: "",
      uploadedFileId: "demoFile3",
      youtubeUrl: "https://www.youtube.com/watch?v=PnmPmDznqnU",
    },
    {
      id: "4",
      s3Key: "app/shetty.mp4",
      title: "Demo Clip 4",
      createdAt: new Date(),
      userId: "demoUser",
      processingStatus: "processed",
      transcript: "",
      customInstructions: "",
      uploadedFileId: "demoFile4",
      youtubeUrl: "https://www.youtube.com/watch?v=cLTUA1lneS0",
    },
  ];

  return (
    <main className="min-h-screen">
      <header className="flex justify-between items-center px-4 sm:px-6 md:px-12 py-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2 text-xl font-semibold">
          CastClip
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium">
          <Link href="#demo">Demo</Link>
          <Link href="#pricing">Pricing</Link>
        </nav>
        <div className="flex items-center gap-4">
          {user ? (
            <Link href="/dashboard">
              <Button variant="secondary" className="text-sm font-semibold">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/sign-in">
              <Button variant="secondary" className="text-sm font-semibold">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="text-center mt-10 px-4 py-16 sm:py-24 lg:py-16">
        <h1 className="text-5xl sm:text-5xl md:text-6xl lg:text-7xl font-bold">
          Grow Your Podcast With
          <br />
          Viral TikTok Clips<span className=""> – in Minutes</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl max-w-xl lg:max-w-2xl mx-auto">
          Turn any episode into 1-5 ready-to-post short videos. No editing needed. Just upload, we do the rest.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-2">
          <Link href={user ? "/dashboard" : "/sign-in"}>
            <Button
              variant="default"
              className="text-base font-semibold inline-flex items-center px-8 py-6"
              size="lg"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-2">
            Get 10 free credits when you sign up!
          </p>
        </div>
      </section>

      {/* Dashboard Preview */}
      <div className="max-w-6xl mx-auto my-4 px-4 sm:px-6 lg:px-8">
        <DashboardFrame>
          <Image
            src="https://castclip.revolt-ai.com/app/dashboard.png"
            width={2211}
            height={1150}
            alt="Dashboard"
            className="w-full h-72 object-cover rounded-md sm:h-auto sm:rounded-md"
          />
        </DashboardFrame>
      </div>

      {/* How It Works Section */}
      <section className="px-4 py-16 sm:py-24 lg:py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 tracking-tight sm:text-4xl">
            How It Works
          </h2>
          <p className="text-muted-foreground mb-12 max-w-2xl mx-auto text-lg">
            Transforming your long-form content into engaging, shareable clips
            is simple and fast. Here&apos;s our straightforward three-step process:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center p-6 bg-background rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <UploadCloud className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Step 1: Upload Podcast
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Easily upload your audio or video podcast file. Our platform
                supports various formats for your convenience.
              </p>
            </div>
            <div className="flex flex-col items-center p-6 bg-background rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Step 2: AI Generates Clips
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Our advanced AI analyzes your content, identifies key moments,
                and automatically generates engaging short clips.
              </p>
            </div>
            <div className="flex flex-col items-center p-6 bg-background rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <Download className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Step 3: Download & Share
              </h3>
              <p className="text-sm text-muted-foreground text-center">
                Review your new clips, download them instantly, and share across
                all your social media platforms to boost engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="text-center px-4 py-16 sm:py-24 lg:py-16">
        <h1 className="text-3xl font-bold mb-4 tracking-tight sm:text-4xl">
          See It In Action
        </h1>
        <p className="text-muted-foreground mb-12 max-w-2xl mx-auto text-lg">
          These video clips were 100% generated by our AI software, showcasing
          its capability to identify viral moments from longer content.
        </p>
        <div className="max-w-5xl mx-auto">
          <ClipDisplay clips={demoClips as any} />
        </div>
      </section>

      {/* Pricing Section - ENSURING THIS IS CORRECTLY PLACED */}
      <section
        id="pricing"
        className="px-4 py-16 sm:py-24 lg:py-16 bg-muted/30"
      >
        <div className="max-w-6xl mx-auto text-center">
          <BillingPage/>
        </div>
      </section>

      {/* Contact Section Placeholder - ENSURING THIS IS CORRECTLY PLACED */}
      <section
        id="contact"
        className="text-center px-4 py-16 sm:py-24 lg:py-16"
      >
        <h2 className="text-3xl font-bold mb-4 tracking-tight sm:text-4xl">
          Ready to Amplify Your Podcast?
        </h2>
        <Link href={user ? "/dashboard" : "/sign-in"}>
          <Button
            variant="default"
            className="text-base font-semibold inline-flex items-center px-8 py-6"
            size="lg"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </section>
    </main>
  );
}
