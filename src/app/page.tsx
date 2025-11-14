/* eslint-disable  @typescript-eslint/no-explicit-any */
import { getUserData } from "@/actions/user";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navigation/navbar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Sparkles,
  Play,
  Check,
  ChevronDown,
  AArrowDown
} from "lucide-react";
import Link from "next/link";
import { ClipDisplay } from "@/components/projects/clip-display";
import PricingSection from "@/components/pricing/pricing-section";
import Image from "next/image";
import { VideoFeaturesPlayer } from "@/components/ui/video-features-player";

export default async function Home() {
  const user = await getUserData();

  const demoClips = [
    {
      id: "1",
      s3Key: "app/examples/demo/clip_1.mp4",
      title: "Demo Clip 1",
      createdAt: new Date(),
      userId: "demoUser",
      processingStatus: "processed",
      transcript: "",
      customInstructions: "",
      uploadedFileId: "demoFile1",
      youtubeUrl: "https://www.youtube.com/watch?v=q-_hwD1jNK4",
    },
    {
      id: "2",
      s3Key: "app/examples/demo/clip_2.mp4",
      title: "Demo Clip 2",
      createdAt: new Date(),
      userId: "demoUser",
      processingStatus: "processed",
      transcript: "",
      customInstructions: "",
      uploadedFileId: "demoFile2",
      youtubeUrl: "https://www.youtube.com/watch?v=0cn3VBjfN8g",
    },
    {
      id: "3",
      s3Key: "app/examples/demo/clip_3.mp4",
      title: "Demo Clip 3",
      createdAt: new Date(),
      userId: "demoUser",
      processingStatus: "processed",
      transcript: "",
      customInstructions: "",
      uploadedFileId: "demoFile3",
      youtubeUrl: "https://www.youtube.com/watch?v=19aKbciNKdA&t=1671s",
    },
  ]

  const stats = [
    { number: "2000+", label: "Clips Generated" },
    { number: "20+", label: "Clippers" },
    { number: "500%", label: "Avg. Growth" },
    { number: "95%", label: "Satisfaction Rate" },
  ];

  const faqs = [
    {
      question: "How does the AI know which moments are viral?",
      answer: "Our AI is trained on millions of viral short-form videos and understands patterns like emotional peaks, surprising statements, actionable advice, and engaging storytelling that drive engagement.",
    },
    {
      question: "How do credits work?",
      answer: "Each short clip (20-90 seconds) costs 2 credits. You can generate 1-10 clips per upload. Credits never expire and all packages are one-time purchases with no subscriptions.",
    },
    {
      question: "What formats do you support?",
      answer: "We currently support MP4 video files up to 2GB in size. Simply upload your podcast or paste a video link to get started.",
    },
    {
      question: "How long does it take to process a podcast?",
      answer: "Most podcasts are processed within 5-15 minutes depending on length. You'll receive an email notification when your clips are ready.",
    },
    {
      question: "Can I customize the clips?",
      answer: "To keep the process as simple as possible, as of now we don't allow any sort of custom editing. We believe customization brings complexity",
    },
    {
      question: "What's included in the free plan?",
      answer: "Every new user gets 10 free credits to generate clips from their podcasts. Thats 5 free clips that you can generate to decide if the service is worth it for you!",
    },
    {
      question: "Do credits expire?",
      answer: "No! Credits never expire and can be used anytime. All our packages are one-time purchases with no recurring subscriptions or hidden fees.",
    },
    {
      question: "What platforms are supported?",
      answer:
        "We support links from all major platforms including YouTube, Vimeo, TikTok, Instagram, Facebook, Twitter (X), Rumble, Twitch, Reddit, and Dailymotion. For other sites, try pasting the link — many providers work out of the box.",
    },
  ];

  return (
    <main className="min-h-screen">
      <Navbar user={user} />

      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:py-32 lg:py-24 overflow-hidden">
        <div className="absolute inset-0" />
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 mr-2" />
              Join 20+ successful clippers
            </Badge>
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            From Video Podcast To
            <br />
            <span className="text-gradient-primary">
              10 Viral Short Clips {" "}
            </span>
            in Minutes
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto mb-8 leading-relaxed">
              CastClip finds the most engaging and valuable moments in your content
              and turns them into ready-to-post vertical videos for TikTok,
              Reels, and Shorts.
            </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href={user ? "/dashboard" : "/sign-in"}>
              <Button size="lg" className="text-lg font-semibold px-6 py-3 h-auto bg-gradient-primary hover:opacity-90 text-white border-0">
                Start Creating Clips Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-500" />
              5 free clips • No credit card required
            </div>

          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-gradient-primary mb-2">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 overflow-hidden">
        <div className="text-center mb-6">
          <p className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider font-medium">
            As Seen On
          </p>
        </div>
        <div className="relative flex items-center justify-center min-h-[60px] overflow-hidden">
          <div className="flex animate-scroll gap-16 sm:gap-20 md:gap-24 items-center">
            {[
              { name: "TikTok", logo: "/logos/tiktok.svg", type: "platform" },
              { name: "Instagram", logo: "/logos/reels.svg", type: "platform" },
              { name: "Shorts", logo: "/logos/shorts.svg", type: "platform" },
              { name: "Product Hunt", logo: "/logos/producthunt.svg", type: "featured" },
              { name: "Hacker News", logo: "/logos/hackernews.svg", type: "featured" },
            ].map((platform, index) => (
              <div
                key={index}
                className="flex shrink-0 items-center justify-center gap-3 px-4 group"
              >
                {platform.logo && (
                  <Image
                    src={platform.logo}
                    alt={`${platform.name} logo`}
                    width={24}
                    height={24}
                    className="w-6 h-6 sm:w-7 sm:h-7 opacity-60 group-hover:opacity-100 transition-opacity"
                  />
                )}
                <div className="text-lg sm:text-xl font-semibold text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                  {platform.name}
                </div>
              </div>
            ))}
            {/* Duplicate logos for seamless infinite scroll */}
            {[
              { name: "TikTok", logo: "/logos/tiktok.svg", type: "platform" },
              { name: "Instagram", logo: "/logos/reels.svg", type: "platform" },
              { name: "Shorts", logo: "/logos/shorts.svg", type: "platform" },
              { name: "Product Hunt", logo: "/logos/producthunt.svg", type: "featured" },
              { name: "Hacker News", logo: "/logos/hackernews.svg", type: "featured" },
            ].map((platform, index) => (
              <div
                key={`duplicate-${index}`}
                className="flex shrink-0 items-center justify-center gap-3 px-4 group"
              >
                {platform.logo && (
                  <Image
                    src={platform.logo}
                    alt={`${platform.name} logo`}
                    width={24}
                    height={24}
                    className="w-6 h-6 sm:w-7 sm:h-7 opacity-60 group-hover:opacity-100 transition-opacity"
                  />
                )}
                <div className="text-lg sm:text-xl font-semibold text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
                  {platform.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Intro Media Grid Section (to be replaced with videos later) */}
      <section className="px-4 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-12">
            {/* Row 1 */}
            <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-center min-h-[320px] sm:min-h-[380px] md:min-h-[440px]">
              <div className="flex flex-col justify-center md:pl-12 lg:pl-16">
                <h3 className="text-xl sm:text-4xl font-bold">Upload Any MP4</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Drag and drop MP4 files up to 2GB. We&apos;ll process the entire episode to find viral moments.
                </p>
              </div>
              <div className="bg-muted/70 border border-border rounded-3xl w-full aspect-square max-w-[22rem] sm:max-w-[26rem] md:max-w-[28rem] lg:max-w-[32rem] mx-auto" />
            </div>

            {/* Row 2 */}
            <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-center min-h-[320px] sm:min-h-[380px] md:min-h-[440px]">
              <div className="bg-muted/70 border border-border rounded-3xl w-full aspect-square max-w-[22rem] sm:max-w-[26rem] md:max-w-[28rem] lg:max-w-[32rem] mx-auto md:order-1 order-2" />
              <div className="order-1 md:order-2 flex flex-col justify-center md:pl-12 lg:pl-16">
                <h3 className="text-xl sm:text-4xl font-bold">Connect Your YouTube Channel</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                Connect your channel to pull videos securely and generate clips without manual uploads.
                </p>
              </div>
            </div>

            {/* Row 3 */}
            <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-center min-h-[320px] sm:min-h-[380px] md:min-h-[440px]">
              <div className="flex flex-col justify-center md:pl-12 lg:pl-16">
                <h3 className="text-xl sm:text-4xl font-bold">Paste Video Link.</h3>
                <p className="text-muted-foreground mt-2 max-w-md">
                  Paste a YouTube video URL and CastClip will generate optimized, share‑ready clips.
                </p>
              </div>
              <div className="bg-muted/70 border border-border rounded-3xl w-full aspect-square max-w-[22rem] sm:max-w-[26rem] md:max-w-[28rem] lg:max-w-[32rem] mx-auto" />
            </div>
          </div>
        </div>
      </section>

      {/* Video Features Section */}
      <section id="demo" className="px-4 py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              See It In Action
            </h2>
          </div>
          {/* Three-column layout: left/right callouts flanking the video on md+; stacked on mobile */}
          <div className="grid gap-6 sm:gap-8 md:gap-10 lg:gap-12 md:grid-cols-[1fr_auto_1fr] items-center">
            {/* Left callout (Captions) */}
            <div className="hidden md:block relative min-h-[400px] md:min-h-[500px] lg:min-h-[600px] xl:min-h-[700px]">
              <div className="p-3 md:p-4 lg:p-5 rounded-xl border border-border/50 bg-muted/90 max-w-[280px] md:max-w-xs lg:max-w-sm absolute bottom-[12%] right-[-8px] md:right-[-12px] lg:right-[-16px] xl:right-[-20px]">
                <div className="text-xs md:text-sm lg:text-base font-semibold mb-1 md:mb-1.5">Live Styled Captions</div>
                <p className="text-muted-foreground text-xs md:text-sm lg:text-base leading-relaxed">
                  Readable, dynamic captions that follow speech and boost retention.
                </p>
              </div>
            </div>

            {/* Video */}
            <div className="relative flex items-center justify-center min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[700px] px-2 sm:px-4 md:px-0">
              <VideoFeaturesPlayer />

              {/* Mobile-sized side callouts positioned around the video */}
              <div className="absolute left-0 top-[3%] sm:left-2 sm:top-[6%] md:hidden z-10">
                <div className="p-2 sm:p-2.5 rounded-lg border border-border/50 bg-muted/95 backdrop-blur-sm shadow-lg w-[110px] sm:w-[130px]">
                  <div className="text-[10px] sm:text-[11px] font-semibold mb-0.5 sm:mb-1 leading-tight break-words">Attention Grabbing Hooks</div>
                  <p className="text-muted-foreground text-[9px] sm:text-[10px] leading-snug break-words">Short, high‑impact openers.</p>
                </div>
              </div>
              <div className="absolute right-0 bottom-[3%] sm:right-2 sm:bottom-[6%] md:hidden z-10">
                <div className="p-2 sm:p-2.5 rounded-lg border border-border/50 bg-muted/95 backdrop-blur-sm shadow-lg w-[110px] sm:w-[130px] text-left">
                  <div className="text-[10px] sm:text-[11px] font-semibold mb-0.5 sm:mb-1 leading-tight break-words">Live Styled Captions</div>
                  <p className="text-muted-foreground text-[9px] sm:text-[10px] leading-snug break-words">Readable, dynamic captions.</p>
                </div>
              </div>
            </div>

            {/* Right callout (Hooks) */}
            <div className="hidden md:block relative min-h-[400px] md:min-h-[500px] lg:min-h-[600px] xl:min-h-[700px]">
              <div className="p-3 md:p-4 lg:p-5 rounded-xl border border-border/50 bg-muted/90 max-w-[280px] md:max-w-xs lg:max-w-sm ml-auto absolute top-[12%]">
                <div className="text-xs md:text-sm lg:text-base font-semibold mb-1 md:mb-1.5">Attention Grabbing Hooks</div>
                <p className="text-muted-foreground text-xs md:text-sm lg:text-base leading-relaxed">
                  Short, high‑impact openers that immediately grab viewers and set context.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="px-4 py-20 sm:py-32">
        <div className="max-w-6xl mx-auto">
          <PricingSection />
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="px-4 py-20 sm:py-32 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about CastClip
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {faqs.map((faq, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-300 h-fit">
                <CardContent className="p-0">
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer">
                      <h3 className="text-lg font-semibold pr-4">{faq.question}</h3>
                      <ChevronDown className="h-5 w-5 text-muted-foreground group-open:rotate-180 transition-transform duration-200 flex-shrink-0" />
                    </summary>
                    <div className="mt-4 text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </div>
                  </details>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="px-4 py-20 sm:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-transparent to-orange-50" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to 10x Your Podcast Growth?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join 20+ clippers who are already growing their audience with AI-powered clips. 
            Start free today—no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href={user ? "/dashboard" : "/sign-in"}>
              <Button size="lg" className="text-lg font-semibold px-6 py-3 h-auto bg-gradient-primary hover:opacity-90 text-white border-0">
                Start Creating Clips Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-green-500" />
              5 free clips • No credit card required
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 px-4 py-12 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Play className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold">CastClip</span>
              </div>
              <p className="text-muted-foreground mb-4">
                Turn your podcasts into viral social media clips with AI.
              </p>
              <div className="flex gap-4">
                <Badge variant="outline">20+ Users</Badge>
                <Badge variant="outline">2k+ Clips</Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link href="#features" className="block hover:text-foreground transition-colors">Features</Link>
                <Link href="#pricing" className="block hover:text-foreground transition-colors">Pricing</Link>
                <Link href="#demo" className="block hover:text-foreground transition-colors">Demo</Link>
                <Link href="#faq" className="block hover:text-foreground transition-colors">FAQ</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link href="mailto:email@castclip.com" className="block hover:text-foreground transition-colors">Help Center</Link>
                <Link href="mailto:email@castclip.com" className="block hover:text-foreground transition-colors">Contact Us</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link href="/privacy-policy" className="block hover:text-foreground transition-colors">Privacy Policy</Link>
                <Link href="/terms-of-service" className="block hover:text-foreground transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border/40 mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 CastClip. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
