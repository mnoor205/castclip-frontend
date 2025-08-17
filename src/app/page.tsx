/* eslint-disable  @typescript-eslint/no-explicit-any */
import { getUserData } from "@/actions/user";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  UploadCloud,
  Sparkles,
  Play,
  Check,
  ChevronDown,
  Youtube,
  Link2,
} from "lucide-react";
import Link from "next/link";
import { ClipDisplay } from "@/components/projects/clip-display";
import PricingSection from "@/components/pricing/pricing-section";

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
    // {
    //   id: "4",
    //   s3Key: "app/shetty.mp4",
    //   title: "Demo Clip 4",
    //   createdAt: new Date(),
    //   userId: "demoUser",
    //   processingStatus: "processed",
    //   transcript: "",
    //   customInstructions: "",
    //   uploadedFileId: "demoFile4",
    //   youtubeUrl: "https://www.youtube.com/watch?v=cLTUA1lneS0",
    // },
  ];

  // const testimonials = [
  //   {
  //     name: "Sarah Chen",
  //     title: "Podcast Host, Tech Talks",
  //     avatar: "SC",
  //     content: "CastClip transformed my podcast growth strategy. I went from 0 to 50K TikTok followers in just 3 months!",
  //     rating: 5,
  //   },
  //   {
  //     name: "Marcus Rodriguez",
  //     title: "Business Podcast Network",
  //     avatar: "MR",
  //     content: "The AI is incredibly accurate at finding the best moments. Saves me 10+ hours per week of editing.",
  //     rating: 5,
  //   },
  //   {
  //     name: "Jennifer Kim",
  //     title: "Wellness Podcast Creator",
  //     avatar: "JK",
  //     content: "My clips now get 100x more engagement than before. The viral moments it finds are spot-on.",
  //     rating: 5,
  //   },
  // ];

  // features section is rendered inline below the hero

  const stats = [
    { number: "1000+", label: "Clips Generated" },
    { number: "10+", label: "Podcasters" },
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
      {/* Header */}
      <header className="flex justify-between items-center px-4 sm:px-6 md:px-12 py-3 sticky top-0 bg-transparent backdrop-blur-md z-50 border-b border-white/20 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-gradient-primary">CastClip</span>
        </div>
        <nav className="hidden md:flex gap-8 text-sm font-medium">
          <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
          <Link href="#demo" className="hover:text-primary transition-colors">Demo</Link>
          <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
          <Link href="#faq" className="hover:text-primary transition-colors">FAQ</Link>
        </nav>
        <div className="flex items-center gap-3">
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
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:py-32 lg:py-24 overflow-hidden">
        <div className="absolute inset-0" />
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 mr-2" />
              Join 10+ successful podcasters
            </Badge>
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            Turn Your Business Podcast into 
            <br />
            <span className="text-gradient-primary">
              Viral Short Clips {" "}
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

      {/* Problem/Solution Section */}
      <section className="px-4 py-20 sm:py-32">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <Badge variant="outline" className="mb-4">The Problem</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-red-600">
                Creating Social Media Content is Eating Your Time
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0" />
                  <p>Spending 10+ hours per week manually editing clips</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0" />
                  <p>Missing the best moments because you can&apos;t watch everything</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0" />
                  <p>Clips getting low engagement because they&apos;re not optimized</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0" />
                  <p>Struggling to keep up with social media demands</p>
                </div>
              </div>
            </div>
            <div>
              <Badge variant="default" className="mb-4 bg-gradient-primary text-white border-0">The Solution</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-green-600">
                AI Does the Heavy Lifting for You
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground">
                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <p>AI analyzes your entire podcast in minutes, not hours</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <p>Automatically finds the most viral-worthy moments</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <p>Creates perfectly formatted clips for all platforms</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <p>Get up to 10 ready-to-post clips at one time</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section (moved below hero) */}
      <section id="features" className="px-4 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3">Ways to Create Clips</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Start with Files, Your Channel, or Links</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Choose the method that fits your workflow. Import your content quickly and let the AI do the rest.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6">
              <CardContent className="p-0">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-pink-100 to-orange-100 p-3 rounded-lg">
                    <UploadCloud className="h-6 w-6 text-gradient-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Upload Files</h3>
                    <p className="text-muted-foreground">Drag and drop MP4 files up to 2GB. We process the entire episode to find viral moments.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-pink-100 to-orange-100 p-3 rounded-lg">
                    <Youtube className="h-6 w-6 text-gradient-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Connect YouTube Channel</h3>
                    <p className="text-muted-foreground">Connect your channel to pull videos securely and generate clips without manual uploads.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardContent className="p-0">
                <div className="flex items-start gap-4">
                  <div className="bg-gradient-to-br from-pink-100 to-orange-100 p-3 rounded-lg">
                    <Link2 className="h-6 w-6 text-gradient-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Use Links</h3>
                    <p className="text-muted-foreground">Paste a link to any video and start generating clips instantly.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="px-4 py-20 sm:py-32 bg-muted/30">
        <div className="max-w-6xl mx-auto text-center">
          <Badge variant="outline" className="mb-4">Demo</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            See it in Action
          </h2>
          <p className="text-xl text-muted-foreground mb-16 max-w-3xl mx-auto">
            These clips were 100% generated by CastClip, with no human editing.
          </p>
          <ClipDisplay clips={demoClips as any} readOnly center/>
        </div>
      </section>

      

      {/* Features Section (original) removed per request */}

      {/* How It Works Section */}
      {/* <section className="px-4 py-20 sm:py-32">
        <div className="max-w-6xl mx-auto text-center">
          <Badge variant="outline" className="mb-4">How It Works</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            From Podcast to Viral Clips in 3 Simple Steps
          </h2>
          <p className="text-xl text-muted-foreground mb-16 max-w-3xl mx-auto">
            Our streamlined process transforms your long-form content into engaging, 
            shareable clips that grow your audience across all social platforms.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection lines for desktop 
            <div className="hidden md:block absolute top-20 left-1/3 w-1/3 h-0.5 bg-gradient-primary opacity-50" />
            <div className="hidden md:block absolute top-20 right-1/3 w-1/3 h-0.5 bg-gradient-primary opacity-50" />
            
            <div className="relative">
              <div className="bg-gradient-primary text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                1
              </div>
              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0 text-center">
                  <div className="bg-gradient-to-br from-pink-100 to-orange-100 p-4 rounded-full inline-block mb-4">
                    <UploadCloud className="h-8 w-8 text-gradient-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Upload or Paste YouTube Link</h3>
                  <p className="text-muted-foreground">
                    Drag and drop an MP4 (up to 2GB), or paste a YouTube link to import directly. 
                    Start with a local file or any public YouTube video.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-primary text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                2
              </div>
              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0 text-center">
                  <div className="bg-gradient-to-br from-pink-100 to-orange-100 p-4 rounded-full inline-block mb-4">
                    <Sparkles className="h-8 w-8 text-gradient-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">AI Creates Viral Clips</h3>
                  <p className="text-muted-foreground">
                    Our AI analyzes uploads and YouTube imports, identifies the most engaging moments, 
                    and creates up to 10 perfectly formatted clips optimized for social media virality.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-primary text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
                3
              </div>
              <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0 text-center">
                  <div className="bg-gradient-to-br from-pink-100 to-orange-100 p-4 rounded-full inline-block mb-4">
                    <Download className="h-8 w-8 text-gradient-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Download & Share</h3>
                  <p className="text-muted-foreground">
                    Review your clips, download in the perfect format for each platform, 
                    and watch your audience grow with content that actually converts.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section> */}

      {/* Testimonials Section */}
      {/* <section className="px-4 py-20 sm:py-32 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Success Stories</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              Join Thousands of Growing Podcasters
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how podcasters like you are growing their audience and revenue with viral clips
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8 hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.title}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

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
            Join 10+ podcasters who are already growing their audience with AI-powered clips. 
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
                <Badge variant="outline">10+ Users</Badge>
                <Badge variant="outline">1k+ Clips</Badge>
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
