"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { authClient, signIn } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SignIn() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  if (session?.user.id) {
    router.replace("/dashboard");
  }

  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50">
      {/* Simple Header */}
      <header className="flex justify-between items-center px-6 py-6">
        <Link href="/" className="text-xl font-bold">
          <span className="text-gradient-primary">CastClip</span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex items-center justify-center px-4 pt-16">
        <div className="max-w-sm w-full">
          {/* Simple Welcome */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Sign in to create viral clips from your podcasts
            </p>
          </div>

          {/* Enhanced Sign In Card */}
          <Card className="border border-border/20 shadow-xl bg-white/95 backdrop-blur-sm rounded-2xl">
            <CardContent className="px-8 py-8">
              <div className="grid gap-4">
                <div
                  className={cn(
                    "w-full gap-2 flex items-center",
                    "justify-between flex-col"
                  )}
                >
                  <Button
                    className={cn(
                      "w-full gap-3 h-11 font-medium",
                      "border border-border bg-white hover:bg-zinc-100"
                    )}
                    disabled={loading}
                    onClick={async () => {
                      await signIn.social(
                        {
                          provider: "google",
                          callbackURL: "/dashboard",
                        },
                        {
                          onRequest: () => {
                            setLoading(true);
                          },
                          onResponse: () => {
                            setLoading(false);
                          },
                        }
                      );
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 256 262"
                    >
                      <path
                        fill="#4285F4"
                        d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.690 H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.690 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                      ></path>
                      <path
                        fill="#34A853"
                        d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                      ></path>
                      <path
                        fill="#FBBC05"
                        d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                      ></path>
                      <path
                        fill="#EB4335"
                        d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                      ></path>
                    </svg>
                    {loading ? "Signing in..." : "Continue with Google"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Simple Footer */}
          <div className="text-center mt-8">
            <p className="text-xs text-muted-foreground">
              By continuing, you agree to our{" "}
              <Link
                href="/terms-of-service"
                className="text-primary hover:underline"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy-policy"
                className="text-primary hover:underline"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
