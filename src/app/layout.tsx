import { Geist, Geist_Mono, Anton } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "./providers";
import { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

// export const metadata = constructMetadata()
export const metadata: Metadata = {
  title: {
    default: "CastClip | Generate Viral Clips For Your Podcast in Minutes",
    template: " %s | CastClip"
  },
  description: "Create viral short-form clips from your long-form video content with AI.",
  keywords: [
    "podcast clipper free", "podcast clipper", "podcast video clip generator", "how to make podcast clips for tiktok", "podcast video editing software", "podcast maker", "ai podcast editing", "ai clip generator", "podcast ai"
  ],
  authors: [{ name: "CastClip" }],
  creator: "CastClip",
  publisher: "CastClip",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      "max-snippet": -1
    }
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "CastClip - AI Podcast Clipper",
    description: "Turn any full length podcast into short viral clips in minutes",
    images: [
      {
        url: "https://castclip.revolt-ai.com/app/preview.png",
        width: 1200,
        height: 630,
        alt: "Preview of CastClip Homepage"
      }
    ],
    siteName: "CastClip",
  },
  twitter: {
    card: "summary_large_image",
    title: "CastClip - AI Podcast Clipper",
    description: "Turn any full length podcast into short viral clips in minutes",
    images: ["https://castclip.revolt-ai.com/app/preview.png"],
    creator: "@_muhammadnoor"
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} bg-gradient-to-br from-pink-50 via-transparent to-orange-50`}
      >
        <PostHogProvider>
          {children}
          <Toaster />
        </PostHogProvider>
        
      </body>
    </html>
  );
}
