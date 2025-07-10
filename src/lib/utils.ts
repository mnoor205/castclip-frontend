import { clsx, type ClassValue } from "clsx"
import { Metadata } from "next"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function constructMetadata({
  title = "CastClip | Generate Viral Clips For Your Podcast in Minutes",
  description = "Castclip turns any full length podcast into short tiktok clips",
  image = "https://castclip.revolt-ai.com/app/preview.png",
  icons = "/favicon.ico",
  noIndex = false
}: {
  title?: string
  description?: string
  image?: string
  icons?: string
  noIndex?: boolean
} = {}): Metadata{
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: image
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      creator: "@_muhammadnoor"
    },
    icons,
    metadataBase: new URL('https://castclip.app'),
    ...(noIndex && {
      robots: {
        index: false,
        follow: false
      }
    })    
  }
}