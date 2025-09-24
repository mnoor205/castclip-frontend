import { buttonVariants } from "@/components/ui/button";
import { VariantProps } from "class-variance-authority";

export interface UserObject {
  id: string
  name: string
  email: string
  image?: string | null | undefined
  credits?: number
  connectedAccounts?: string[]
  youtubeChannelId?: string | null
  youtubeChannelTitle?: string | null
}

export interface AuthUserObject {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null | undefined;
  stripeCustomerId?: string | null | undefined
}

export type PriceId = "small" | "medium" | "large"

export interface PricingPlan {
  title: string;
  price: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonVariant: VariantProps<typeof buttonVariants>["variant"];
  isPopular?: boolean;
  savePercentage?: string;
  priceId: PriceId;
}

// Error handling types
export interface APIError extends Error {
  statusCode?: number;
  details?: string;
}

// Stripe types
export interface StripeError extends Error {
  type: string;
  code?: string;
  decline_code?: string;
  param?: string;
}


// YouTube Types
export interface Video {
  id: string
  title: string
  thumbnailUrl: string
}

export interface YouTubeChannel {
  channelId: string
  channelTitle: string
  channelHandle?: string
  subscriberCount?: string
  videoCount?: string
  thumbnailUrl?: string
}

export interface YouTubeResponse {
  connected: boolean
  videos: Video[]
  nextPageToken: string | null
}

export interface YouTubeSearchResponse {
  videos: Video[]
  nextPageToken: string | null
}

export interface VideoSelectorData {
  videos: Video[]
  nextPageToken: string | null
}

// video-preview
export type VideoMetadata = {
  durationInSeconds: number | null;
  dimensions: {
    width: number;
    height: number;
  } | null;
  fps: number | null;
};

export type TranscriptWord = {
  word: string;
  start: number;
  end: number;
};