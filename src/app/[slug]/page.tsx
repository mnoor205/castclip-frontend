// /* eslint-disable  @typescript-eslint/no-explicit-any */
// import { getUserData } from "@/actions/user";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent } from "@/components/ui/card";
// import {
//   ArrowRight,
//   UploadCloud,
//   Sparkles,
//   Download,
//   Play,
//   Clock,
//   Check,
//   Zap,
//   Target,
//   BarChart,
//   ChevronDown,
// } from "lucide-react";
// import Link from "next/link";
// import { ClipDisplay } from "@/components/dashboard/clip-display";
// import PricingSection from "@/components/pricing/pricing-section";
// import { getPlatformFromSlug, getPlatformConfig } from "@/lib/platform-config";
// import { notFound } from "next/navigation";
// import type { Metadata } from "next";

// interface Props {
//   params: Promise<{ slug: string }>;
// }

// export async function generateMetadata({ params }: Props): Promise<Metadata> {
//   const { slug } = await params;
//   const platform = getPlatformFromSlug(slug);
  
//   if (!platform) {
//     return {
//       title: "Page Not Found",
//       description: "The page you're looking for doesn't exist.",
//     };
//   }

//   const config = getPlatformConfig(platform);
//   if (!config) {
//     return {
//       title: "Page Not Found", 
//       description: "The page you're looking for doesn't exist.",
//     };
//   }

//   return {
//     title: config.seo.title,
//     description: config.seo.description,
//     keywords: config.seo.keywords.join(", "),
//     openGraph: {
//       title: config.seo.title,
//       description: config.seo.description,
//       type: "website",
//     },
//     twitter: {
//       card: "summary_large_image",
//       title: config.seo.title,
//       description: config.seo.description,
//     },
//   };
// }

// export default async function PlatformPage({ params }: Props) {
//   const { slug } = await params;
//   const platform = getPlatformFromSlug(slug);
  
//   if (!platform) {
//     notFound();
//   }

//   const config = getPlatformConfig(platform);
//   if (!config) {
//     notFound();
//   }

//   const user = await getUserData();

//   const demoClips = [
//     {
//       id: "1",
//       s3Key: "app/examples/demo/clip_1.mp4",
//       title: "Demo Clip 1",
//       createdAt: new Date(),
//       userId: "demoUser",
//       processingStatus: "processed",
//       transcript: "",
//       customInstructions: "",
//       uploadedFileId: "demoFile1",
//       youtubeUrl: "https://www.youtube.com/watch?v=q-_hwD1jNK4",
//     },
//     {
//       id: "2",
//       s3Key: "app/examples/demo/clip_2.mp4",
//       title: "Demo Clip 2",
//       createdAt: new Date(),
//       userId: "demoUser",
//       processingStatus: "processed",
//       transcript: "",
//       customInstructions: "",
//       uploadedFileId: "demoFile2",
//       youtubeUrl: "https://www.youtube.com/watch?v=0cn3VBjfN8g",
//     },
//     {
//       id: "3",
//       s3Key: "app/examples/demo/clip_3.mp4",
//       title: "Demo Clip 3",
//       createdAt: new Date(),
//       userId: "demoUser",
//       processingStatus: "processed",
//       transcript: "",
//       customInstructions: "",
//       uploadedFileId: "demoFile3",
//       youtubeUrl: "https://www.youtube.com/watch?v=19aKbciNKdA&t=1671s",
//     },
//   ];

//   const features = [
//     {
//       icon: <Zap className="h-6 w-6" />,
//       title: "AI-Powered Clip Generation",
//       description: `Advanced AI analyzes your content and identifies the most engaging moments for ${config.displayName} automatically.`,
//     },
//     {
//       icon: <Target className="h-6 w-6" />,
//       title: "Viral Moment Detection",
//       description: `Our AI understands what makes ${config.displayName} content go viral and finds those exact moments in your podcasts.`,
//     },
//     {
//       icon: <Clock className="h-6 w-6" />,
//       title: "10x Faster Than Manual Editing",
//       description: "What takes hours of manual editing is done in minutes. More time creating, less time editing.",
//     },
//     {
//       icon: <BarChart className="h-6 w-6" />,
//       title: `Optimized for ${config.displayName}`,
//       description: `Clips are automatically formatted for ${config.displayName} (${config.features.aspectRatio}, ${config.features.videoLength}) and other platforms.`,
//     },
//   ];

//   const stats = [
//     { number: "1000+", label: "Clips Generated" },
//     { number: "10+", label: "Podcasters" },
//     { number: "500%", label: "Avg. Growth" },
//     { number: "95%", label: "Satisfaction Rate" },
//   ];

//   const faqs = [
//     {
//       question: "How does the AI know which moments are viral?",
//       answer: `Our AI is trained on millions of viral ${config.displayName} videos and understands patterns like emotional peaks, surprising statements, actionable advice, and engaging storytelling that drive engagement.`,
//     },
//     {
//       question: "How do credits work?",
//       answer: "Each short clip (20-90 seconds) cost 2 credits. You can generate 1-10 clips per upload. Credits never expire and all packages are one-time purchases with no subscriptions.",
//     },
//     {
//       question: "What formats do you support?",
//       answer: "We currently support MP4 video files up to 2GB in size. Simply upload your podcast episode or video content directly from your computer.",
//     },
//     {
//       question: "How long does it take to process a podcast?",
//       answer: "Most podcasts are processed within 5-15 minutes depending on length. You'll receive an email notification when your clips are ready.",
//     },
//     {
//       question: `Are clips optimized for ${config.displayName}?`,
//       answer: `Yes! All clips are automatically formatted for ${config.displayName} with the optimal ${config.features.aspectRatio} aspect ratio and ${config.features.videoLength} length for maximum engagement.`,
//     },
//     {
//       question: "What's included in the free plan?",
//       answer: "Every new user gets 10 free credits to generate clips from their podcasts. That's 5 free clips that you can generate to decide if the service is worth it for you!",
//     },
//     {
//       question: "Do credits expire?",
//       answer: "No! Credits never expire and can be used anytime. All our packages are one-time purchases with no recurring subscriptions or hidden fees.",
//     },
//   ];

//   return (
//     <main className="min-h-screen bg-gradient-to-br from-pink-50 via-transparent to-orange-50">
//       {/* Header */}
//       <header className="flex justify-between items-center px-4 sm:px-6 md:px-12 py-3 sticky top-0 bg-transparent backdrop-blur-md z-50 border-b border-white/20 shadow-sm">
//         <div className="flex items-center gap-3">
//           <Link href="/">
//             <span className="text-xl font-bold text-gradient-primary">CastClip</span>
//           </Link>
//         </div>
//         <nav className="hidden md:flex gap-8 text-sm font-medium">
//           <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
//           <Link href="#demo" className="hover:text-primary transition-colors">Demo</Link>
//           <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
//           <Link href="#faq" className="hover:text-primary transition-colors">FAQ</Link>
//         </nav>
//         <div className="flex items-center gap-3">
//           {user ? (
//             <Link href="/dashboard">
//               <Button variant="outline" className="font-medium px-4 py-2">
//                 Dashboard
//               </Button>
//             </Link>
//           ) : (
//             <>
//               <Link href="/sign-in">
//                 <Button variant="ghost" className="font-medium px-3 py-2 text-sm">
//                   Sign In
//                 </Button>
//               </Link>
//               <Link href="/sign-in">
//                 <Button className="font-medium px-4 py-2 bg-gradient-primary hover:opacity-90 text-white border-0 text-sm">
//                   Get Started
//                 </Button>
//               </Link>
//             </>
//           )}
//         </div>
//       </header>

//       {/* Hero Section */}
//       <section className="relative px-4 py-20 sm:py-32 lg:py-24 overflow-hidden">
//         <div className="absolute inset-0" />
//         <div className="relative max-w-7xl mx-auto text-center">
//           <div className="flex justify-center mb-6">
//             <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
//               <Sparkles className="h-4 w-4 mr-2" />
//               Join 10+ successful podcasters growing on {config.displayName}
//             </Badge>
//           </div>
          
//           <h1 className="text-4xl sm:text-6xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 whitespace-pre-line">
//             {config.hero.title}
//           </h1>
          
//           <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
//             {config.hero.description}
//             <strong className="text-foreground"> No editing skills required.</strong>
//           </p>

//           <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
//             <Link href={user ? "/dashboard" : "/sign-in"}>
//               <Button size="lg" className="text-lg font-semibold px-6 py-3 h-auto bg-gradient-primary hover:opacity-90 text-white border-0">
//                 {config.hero.ctaText}
//                 <ArrowRight className="ml-2 h-5 w-5" />
//               </Button>
//             </Link>
//             <div className="flex items-center gap-2 text-sm text-muted-foreground">
//               <Check className="h-4 w-4 text-green-500" />
//               5 free clips • No credit card required
//             </div>
//           </div>

//           {/* Platform-specific stats */}
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
//             <div className="text-center">
//               <div className="text-3xl md:text-4xl font-bold text-gradient-primary mb-2">{config.features.audienceSize}</div>
//               <div className="text-sm text-muted-foreground">{config.displayName} Users</div>
//             </div>
//             {stats.slice(1).map((stat, index) => (
//               <div key={index} className="text-center">
//                 <div className="text-3xl md:text-4xl font-bold text-gradient-primary mb-2">{stat.number}</div>
//                 <div className="text-sm text-muted-foreground">{stat.label}</div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Demo Section */}
//       <section id="demo" className="px-4 py-20 sm:py-32 bg-muted/30">
//         <div className="max-w-6xl mx-auto text-center">
//           <Badge variant="outline" className="mb-4">Live Demo</Badge>
//           <h2 className="text-3xl sm:text-4xl font-bold mb-6">
//             See Our AI in Action
//           </h2>
//           <p className="text-xl text-muted-foreground mb-16 max-w-3xl mx-auto">
//             These clips were 100% generated by our AI from real podcasts, ready for {config.displayName}. 
//             No human editing, no manual selection—just pure AI magic finding viral moments.
//           </p>
//           <ClipDisplay clips={demoClips as any} center />
//         </div>
//       </section>

//       {/* Problem/Solution Section */}
//       <section className="px-4 py-20 sm:py-32">
//         <div className="max-w-6xl mx-auto">
//           <div className="grid lg:grid-cols-2 gap-16 items-center">
//             <div>
//               <Badge variant="outline" className="mb-4">The Problem</Badge>
//               <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-red-600">
//                 Creating {config.displayName} Content is Eating Your Time
//               </h2>
//               <div className="space-y-4 text-lg text-muted-foreground">
//                 <div className="flex items-start gap-3">
//                   <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0" />
//                   <p>Spending 10+ hours per week manually editing clips for {config.displayName}</p>
//                 </div>
//                 <div className="flex items-start gap-3">
//                   <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0" />
//                   <p>Missing the best moments because you can&apos;t watch everything</p>
//                 </div>
//                 <div className="flex items-start gap-3">
//                   <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0" />
//                   <p>Clips getting low engagement because they&apos;re not optimized for {config.displayName}</p>
//                 </div>
//                 <div className="flex items-start gap-3">
//                   <div className="w-2 h-2 bg-red-500 rounded-full mt-3 flex-shrink-0" />
//                   <p>Struggling to keep up with {config.displayName}&apos;s content demands</p>
//                 </div>
//               </div>
//             </div>
//             <div>
//               <Badge variant="default" className="mb-4 bg-gradient-primary text-white border-0">The Solution</Badge>
//               <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-green-600">
//                 AI Does the Heavy Lifting for {config.displayName}
//               </h2>
//               <div className="space-y-4 text-lg text-muted-foreground">
//                 <div className="flex items-start gap-3">
//                   <Check className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
//                   <p>AI analyzes your entire podcast in minutes, not hours</p>
//                 </div>
//                 <div className="flex items-start gap-3">
//                   <Check className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
//                   <p>Automatically finds the most viral-worthy moments for {config.displayName}</p>
//                 </div>
//                 <div className="flex items-start gap-3">
//                   <Check className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
//                   <p>Creates perfectly formatted clips ({config.features.aspectRatio}, {config.features.videoLength})</p>
//                 </div>
//                 <div className="flex items-start gap-3">
//                   <Check className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
//                   <p>Get up to 10 ready-to-post {config.displayName} clips at one time</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Features Section */}
//       <section id="features" className="px-4 py-20 sm:py-32 bg-muted/30">
//         <div className="max-w-6xl mx-auto">
//           <div className="text-center mb-16">
//             <Badge variant="outline" className="mb-4">Features</Badge>
//             <h2 className="text-3xl sm:text-4xl font-bold mb-6">
//               Powerful AI, Optimized for {config.displayName}
//             </h2>
//             <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
//               Our advanced AI doesn&apos;t just cut your content—it understands what makes {config.displayName} clips go viral
//               and creates content that actually converts viewers into fans.
//             </p>
//           </div>
          
//           <div className="grid md:grid-cols-2 gap-8">
//             {features.map((feature, index) => (
//               <Card key={index} className="p-8 hover:shadow-lg transition-shadow duration-300">
//                 <CardContent className="p-0">
//                   <div className="flex items-start gap-4">
//                     <div className="bg-gradient-to-br from-pink-100 to-orange-100 p-3 rounded-lg">
//                       <div className="text-gradient-primary">
//                         {feature.icon}
//                       </div>
//                     </div>
//                     <div>
//                       <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
//                       <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
//                     </div>
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>

//           {/* Platform-specific features highlight */}
//           <div className="mt-12 text-center">
//             <Card className="p-8 bg-gradient-to-br from-pink-50 to-orange-50 border-2 border-gradient-primary/20">
//               <CardContent className="p-0">
//                 <h3 className="text-2xl font-bold mb-4 text-gradient-primary">Perfect for {config.displayName}</h3>
//                 <p className="text-lg text-muted-foreground mb-4">
//                   {config.features.description}
//                 </p>
//                 <div className="grid md:grid-cols-3 gap-4 text-sm">
//                   <div className="flex items-center gap-2">
//                     <Check className="h-4 w-4 text-green-500" />
//                     <span>{config.features.aspectRatio} format</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Check className="h-4 w-4 text-green-500" />
//                     <span>{config.features.videoLength} duration</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Check className="h-4 w-4 text-green-500" />
//                     <span>Optimized for {config.features.audienceSize}</span>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </section>

//       {/* How It Works Section */}
//       <section className="px-4 py-20 sm:py-32">
//         <div className="max-w-6xl mx-auto text-center">
//           <Badge variant="outline" className="mb-4">How It Works</Badge>
//           <h2 className="text-3xl sm:text-4xl font-bold mb-6">
//             From Podcast to Viral {config.displayName} Clips in 3 Simple Steps
//           </h2>
//           <p className="text-xl text-muted-foreground mb-16 max-w-3xl mx-auto">
//             Our streamlined process transforms your long-form content into engaging {config.displayName} clips 
//             that grow your audience and drive business results.
//           </p>
          
//           <div className="grid md:grid-cols-3 gap-8 relative">
//             {/* Connection lines for desktop */}
//             <div className="hidden md:block absolute top-20 left-1/3 w-1/3 h-0.5 bg-gradient-primary opacity-50" />
//             <div className="hidden md:block absolute top-20 right-1/3 w-1/3 h-0.5 bg-gradient-primary opacity-50" />
            
//             <div className="relative">
//               <div className="bg-gradient-primary text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
//                 1
//               </div>
//               <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
//                 <CardContent className="p-0 text-center">
//                   <div className="bg-gradient-to-br from-pink-100 to-orange-100 p-4 rounded-full inline-block mb-4">
//                     <UploadCloud className="h-8 w-8 text-gradient-primary" />
//                   </div>
//                   <h3 className="text-xl font-semibold mb-4">Upload Your Podcast</h3>
//                   <p className="text-muted-foreground">
//                     Simply drag and drop your MP4 video file. We support files up to 2GB in size. 
//                     Upload your podcast episode or video content directly from your computer.
//                   </p>
//                 </CardContent>
//               </Card>
//             </div>
            
//             <div className="relative">
//               <div className="bg-gradient-primary text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
//                 2
//               </div>
//               <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
//                 <CardContent className="p-0 text-center">
//                   <div className="bg-gradient-to-br from-pink-100 to-orange-100 p-4 rounded-full inline-block mb-4">
//                     <Sparkles className="h-8 w-8 text-gradient-primary" />
//                   </div>
//                   <h3 className="text-xl font-semibold mb-4">AI Creates Viral {config.displayName} Clips</h3>
//                   <p className="text-muted-foreground">
//                     Our AI analyzes your content, identifies the most engaging moments, 
//                     and creates up to 10 {config.displayName}-optimized clips ({config.features.aspectRatio}, {config.features.videoLength}).
//                   </p>
//                 </CardContent>
//               </Card>
//             </div>
            
//             <div className="relative">
//               <div className="bg-gradient-primary text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-6">
//                 3
//               </div>
//               <Card className="p-8 hover:shadow-lg transition-shadow duration-300">
//                 <CardContent className="p-0 text-center">
//                   <div className="bg-gradient-to-br from-pink-100 to-orange-100 p-4 rounded-full inline-block mb-4">
//                     <Download className="h-8 w-8 text-gradient-primary" />
//                   </div>
//                   <h3 className="text-xl font-semibold mb-4">Share on {config.displayName}</h3>
//                   <p className="text-muted-foreground">
//                     Download your perfectly formatted {config.displayName} clips and watch your audience grow 
//                     with content that actually converts viewers into customers.
//                   </p>
//                 </CardContent>
//               </Card>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Pricing Section */}
//       <section id="pricing" className="px-4 py-20 sm:py-32 bg-muted/30">
//         <div className="max-w-6xl mx-auto">
//           <PricingSection />
//         </div>
//       </section>

//       {/* FAQ Section */}
//       <section id="faq" className="px-4 py-20 sm:py-32">
//         <div className="max-w-6xl mx-auto">
//           <div className="text-center mb-16">
//             <Badge variant="outline" className="mb-4">FAQ</Badge>
//             <h2 className="text-3xl sm:text-4xl font-bold mb-6">
//               Frequently Asked Questions
//             </h2>
//             <p className="text-xl text-muted-foreground">
//               Everything you need to know about creating {config.displayName} clips
//             </p>
//           </div>
          
//           <div className="grid md:grid-cols-2 gap-8 items-start">
//             {faqs.map((faq, index) => (
//               <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-300 h-fit">
//                 <CardContent className="p-0">
//                   <details className="group">
//                     <summary className="flex items-center justify-between cursor-pointer">
//                       <h3 className="text-lg font-semibold pr-4">{faq.question}</h3>
//                       <ChevronDown className="h-5 w-5 text-muted-foreground group-open:rotate-180 transition-transform duration-200 flex-shrink-0" />
//                     </summary>
//                     <div className="mt-4 text-muted-foreground leading-relaxed">
//                       {faq.answer}
//                     </div>
//                   </details>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Final CTA Section */}
//       <section className="px-4 py-20 sm:py-32 relative overflow-hidden bg-muted/30">
//         <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-transparent to-orange-50" />
//         <div className="relative max-w-4xl mx-auto text-center">
//           <h2 className="text-3xl sm:text-4xl font-bold mb-6">
//             Ready to Grow Your Audience on {config.displayName}?
//           </h2>
//           <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
//             Join 10+ podcasters who are already growing their {config.displayName} presence with AI-powered clips. 
//             Start free today—no credit card required.
//           </p>
//           <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
//             <Link href={user ? "/dashboard" : "/sign-in"}>
//               <Button size="lg" className="text-lg font-semibold px-6 py-3 h-auto bg-gradient-primary hover:opacity-90 text-white border-0">
//                 {config.hero.ctaText}
//                 <ArrowRight className="ml-2 h-5 w-5" />
//               </Button>
//             </Link>
//             <div className="flex items-center gap-2 text-sm text-muted-foreground">
//               <Check className="h-4 w-4 text-green-500" />
//               5 free clips • No credit card required • Cancel anytime
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="border-t border-border/40 px-4 py-12 bg-muted/20">
//         <div className="max-w-6xl mx-auto">
//           <div className="grid md:grid-cols-4 gap-8">
//             <div>
//               <div className="flex items-center gap-3 mb-4">
//                 <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
//                   <Play className="h-4 w-4 text-white" />
//                 </div>
//                 <Link href="/">
//                   <span className="text-xl font-bold">CastClip</span>
//                 </Link>
//               </div>
//               <p className="text-muted-foreground mb-4">
//                 Turn your podcasts into viral {config.displayName} clips with AI.
//               </p>
//               <div className="flex gap-4">
//                 <Badge variant="outline">10+ Users</Badge>
//                 <Badge variant="outline">1k+ Clips</Badge>
//               </div>
//             </div>
            
//             <div>
//               <h4 className="font-semibold mb-4">Product</h4>
//               <div className="space-y-2 text-sm text-muted-foreground">
//                 <Link href="#features" className="block hover:text-foreground transition-colors">Features</Link>
//                 <Link href="#pricing" className="block hover:text-foreground transition-colors">Pricing</Link>
//                 <Link href="#demo" className="block hover:text-foreground transition-colors">Demo</Link>
//                 <Link href="#faq" className="block hover:text-foreground transition-colors">FAQ</Link>
//               </div>
//             </div>
            
//             <div>
//               <h4 className="font-semibold mb-4">Support</h4>
//               <div className="space-y-2 text-sm text-muted-foreground">
//                 <Link href="mailto:email@castclip.com" className="block hover:text-foreground transition-colors">Help Center</Link>
//                 <Link href="mailto:email@castclip.com" className="block hover:text-foreground transition-colors">Contact Us</Link>
//               </div>
//             </div>
            
//             <div>
//               <h4 className="font-semibold mb-4">Legal</h4>
//               <div className="space-y-2 text-sm text-muted-foreground">
//                 <Link href="/privacy-policy" className="block hover:text-foreground transition-colors">Privacy Policy</Link>
//                 <Link href="/terms-of-service" className="block hover:text-foreground transition-colors">Terms of Service</Link>
//               </div>
//             </div>
//           </div>
          
//           <div className="border-t border-border/40 mt-12 pt-8 text-center text-sm text-muted-foreground">
//             <p>&copy; 2025 CastClip. All rights reserved.</p>
//           </div>
//         </div>
//       </footer>
//     </main>
//   );
// } 