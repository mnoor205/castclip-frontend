"use client"
import { createCheckoutSession } from "@/actions/stripe";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { authClient } from "@/lib/auth-client";
import { PricingPlan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckIcon, Sparkles } from "lucide-react";
import Link from "next/link";

const plans: PricingPlan[] = [
  {
    title: "Small Pack",
    price: "$9.99",
    description: "Perfect for occasional podcast creators",
    features: ["50 credits", "No expiration", "Download all clips", "Generate up to 25 clips"],
    buttonText: "Buy 50 credits",
    buttonVariant: "outline",
    priceId: "small",
  },
  {
    title: "Medium Pack",
    price: "$24.99",
    description: "Best value for regular clippers",
    features: ["150 credits", "No expiration", "Download all clips", "Generate up to 75 clips"],
    buttonText: "Buy 150 credits",
    buttonVariant: "default",
    isPopular: true,
    savePercentage: "Save 17%",
    priceId: "medium",
  },
  {
    title: "Large Pack",
    price: "$69.99",
    description: "Ideal for podcast studios and agencies",
    features: ["500 credits", "No expiration", "Download all clips", "Generate up to 250 clips"],
    buttonText: "Buy 500 credits",
    buttonVariant: "outline",
    isPopular: false,
    savePercentage: "Save 30%",
    priceId: "large",
  },
];

function PricingCard({ plan, userId, variant = "default" }: { 
  plan: PricingPlan, 
  userId?: string,
  variant?: "default" | "compact"
}) {
  const isPopular = plan.isPopular;
  
  return (
    <Card
      className={cn(
        "relative flex flex-col",
        isPopular && variant === "default" && "shadow-xl scale-105 rounded-xl",
        isPopular && variant === "default" && "rounded-gradient-border",
        !isPopular && "shadow-lg hover:shadow-xl transition-all duration-300",
        variant === "compact" && "p-4"
      )}
    >
      {isPopular && variant === "default" && (
        <div className="bg-gradient-primary text-white absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap shadow-lg">
          <Sparkles className="h-4 w-4 inline mr-1" />
          Most Popular
        </div>
      )}
      <CardHeader className={cn("flex-1", variant === "compact" ? "pt-6 pb-4" : "pt-10 sm:pt-6")}>
        <div className="flex items-center justify-between">
          <CardTitle className={variant === "compact" ? "text-lg" : "text-xl"}>{plan.title}</CardTitle>
          {plan.savePercentage && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
              {plan.savePercentage}
            </Badge>
          )}
        </div>
        <div className={cn("font-bold text-gradient-primary", variant === "compact" ? "text-3xl" : "text-4xl")}>
          {plan.price}
        </div>
        <CardDescription className={variant === "compact" ? "text-sm" : undefined}>
          {plan.description}
        </CardDescription>
      </CardHeader>
      <CardContent className={cn("space-y-2 flex-1", variant === "compact" && "py-4")}>
        <ul className={cn("text-muted-foreground space-y-2", variant === "compact" ? "text-sm" : "text-sm")}>
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <CheckIcon className="text-green-500 size-4 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className={variant === "compact" ? "pt-4" : undefined}>
        {userId ? (
          <Button 
            onClick={() => createCheckoutSession(plan.priceId)} 
            variant={plan.buttonVariant} 
            className={cn(
              "w-full font-semibold",
              plan.buttonVariant === "default" && "bg-gradient-primary hover:opacity-90 text-white border-0"
            )}
          >
            {plan.buttonText}
          </Button>
        ) : (
          <Link className="w-full" href='/sign-in'>
            <Button 
              variant={plan.buttonVariant} 
              className={cn(
                "w-full font-semibold",
                plan.buttonVariant === "default" && "bg-gradient-primary hover:opacity-90 text-white border-0"
              )}
            >
              {plan.buttonText}
            </Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}

interface PricingSectionProps {
  showHeader?: boolean;
  title?: string;
  description?: string;
  variant?: "default" | "compact";
  className?: string;
}

export default function PricingSection({ 
  showHeader = true, 
  title = "Simple, Transparent Pricing",
  description = "Start free and only pay for what you need. No subscription, no hidden fees, no surprises.",
  variant = "default",
  className
}: PricingSectionProps) {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  return (
    <div className={cn("mx-auto flex flex-col space-y-8", className)}>
      {showHeader && (
        <div className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            {title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {description}
          </p>
          <div className="flex justify-center mb-8">
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-green-50 text-green-700 border-green-200">
              <Sparkles className="h-4 w-4 mr-2" />
              Every new user gets 10 free credits to start!
            </Badge>
          </div>
        </div>
      )}

      <div className={cn(
        "grid gap-8",
        variant === "compact" ? "grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto" : "grid-cols-1 md:grid-cols-3"
      )}>
        {plans.map((plan) => (
          <PricingCard key={plan.title} plan={plan} userId={user?.id} variant={variant} />
        ))}
      </div>
    </div>
  );
} 