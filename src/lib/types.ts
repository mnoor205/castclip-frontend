import { buttonVariants } from "@/components/ui/button";
import { VariantProps } from "class-variance-authority";

export interface UserObject {
  id: string
  email: string
  image?: string | null | undefined
  credits: number
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