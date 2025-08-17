/* eslint-disable @typescript-eslint/no-explicit-any */
import { buttonVariants } from "@/components/ui/button";
import { VariantProps } from "class-variance-authority";

export interface UserObject {
  id: string
  name: string
  email: string
  image?: string | null | undefined
  credits?: number
  connectedAccounts?: string[]
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

// Google OAuth types
export interface GoogleAuthResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface GoogleTokenInfo {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

// Stripe types
export interface StripeError extends Error {
  type: string;
  code?: string;
  decline_code?: string;
  param?: string;
}

// Google OAuth client types
export interface GoogleOAuthClient {
  requestCode: () => void;
  callback: (response: any) => void;
}

export interface GoogleOAuthInitConfig {
  client_id: string;
  scope: string;
  ux_mode: 'popup' | 'redirect';
  redirect_uri?: string;
  callback: (response: any) => void;
}

export interface GoogleOAuthError {
  type: string;
  message: string;
}