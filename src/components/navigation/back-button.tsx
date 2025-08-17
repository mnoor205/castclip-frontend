"use client"

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function BackButton({ fallbackHref = "/dashboard" }: { fallbackHref?: string }) {
  const router = useRouter();

  const handleClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };

  return (
    <Button variant="ghost" className="hover:cursor-pointer" aria-label="Go back" onClick={handleClick}>
      <ArrowLeft className="h-5 w-5" />
    </Button>
  );
}
