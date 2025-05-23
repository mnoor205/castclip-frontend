"use client"
import { createCheckoutSession } from "@/actions/stripe";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { PricingPlan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import Link from "next/link";

const plans: PricingPlan[] = [
  {
    title: "Small Pack",
    price: "$9.99",
    description: "Perfect for occasional podcast creators",
    features: ["50 credits", "No expiration", "Download all clips"],
    buttonText: "Buy 50 credits",
    buttonVariant: "outline",
    priceId: "small",
  },
  {
    title: "Medium Pack",
    price: "$24.99",
    description: "Best value for regular podcasters",
    features: ["150 credits", "No expiration", "Download all clips"],
    buttonText: "Buy 150 credits",
    buttonVariant: "default",
    isPopular: true,
    savePercentage: "Save 17%",
    priceId: "medium",
  },
  {
    title: "Large Pack",
    price: "$69.99",
    description: "Ideal for podcast studioes and agencies",
    features: ["500 credits", "No expiration", "Download all clips"],
    buttonText: "Buy 500 credits",
    buttonVariant: "outline",
    isPopular: false,
    savePercentage: "Save 30%",
    priceId: "large",
  },
];

function PricingCard({ plan, userId }: { plan: PricingPlan, userId?: string }) {
  return (
    <Card
      className={cn(
        "relative flex flex-col",
        plan.isPopular && "border-primary border-2 shadow-xl",
        !plan.isPopular &&
        "shadow-lg hover:shadow-xl transition-shadow duration-300"
      )}
    >
      {plan.isPopular && (
        <div className="bg-primary text-primary-foreground absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 transform rounded-full px-3 py-1 text-sm font-medium whitespace-nowrap">
          Most Popular
        </div>
      )}
      <CardHeader className="flex-1 pt-10 sm:pt-6">
        <CardTitle>{plan.title}</CardTitle>
        <div className="text-4xl font-bold">{plan.price}</div>
        {plan.savePercentage && (
          <p className="text-sm font-medium text-green-500">
            {plan.savePercentage}
          </p>
        )}
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 flex-1">
        <ul className="text-muted-foreground space-y-2 text-sm">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2">
              <CheckIcon className="text-primary size-4" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {userId ? (
          <Button onClick={() => createCheckoutSession(plan.priceId)} variant={plan.buttonVariant} className="w-full">
            Choose Plan
          </Button>
        ) : (
          <Link className="w-full" href='/sign-in'>
            <Button variant={plan.buttonVariant} className="w-full">
              Choose Plan
            </Button>
          </Link>

        )}
      </CardFooter>
    </Card>
  );
}

export default function BillingPage() {

  const { 
        data: session,
    } = authClient.useSession() 

    const user = session?.user

  return (
    <div className="mx-auto flex flex-col space-y-8 px-4 py-12">
      <div className="relative flex items-center justify-center gap-4">
        <div className="space-y-2 text-center">
          <h2 className="text-3xl font-bold mb-4 tracking-tight sm:text-4xl">
            Flexible Plans for Every Creator
          </h2>
          <p className="text-muted-foreground mb-12 max-w-3xl mx-auto text-lg">
            Simple, transparent pricing. No subscriptions, no hidden fees.
            Credits never expire, and every new user gets{" "}
            <span className="font-semibold text-primary">10 free credits</span>{" "}
            to start!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <PricingCard key={plan.title} plan={plan} userId={user?.id} />
        ))}
      </div>

      <div className="max-w-3xl mx-auto bg-background rounded-xl shadow-lg p-6 sm:p-8">
        <h3 className="mb-6 text-2xl font-semibold text-center">
          How Credits Work
        </h3>
        <ul className="text-muted-foreground list-disc space-y-3 pl-5 text-left text-sm sm:text-base">
          <li>
            Each short clip (between 20 and 60 seconds) costs approximately{" "}
            <span className="font-semibold text-primary">2 credits</span>.
          </li>
          <li>
            You choose how many clips (between 1 and 5) to generate per
            uploaded video. Our AI aims for roughly 1 clip per 5 minutes of
            content as a guideline.
          </li>
          <li>
            Credits{" "}
            <span className="font-semibold text-primary">never expire</span>{" "}
            and can be used anytime you need them.
          </li>
          <li>
            Longer podcasts or requests for more clips per video will
            consume more credits accordingly.
          </li>
          <li>
            All packages are{" "}
            <span className="font-semibold text-primary">
              one-time purchases
            </span>{" "}
            – no recurring subscriptions.
          </li>
        </ul>
      </div>
    </div>
  );
}