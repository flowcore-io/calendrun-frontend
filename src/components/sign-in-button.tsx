"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

interface SignInButtonProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function SignInButton({ children, className, variant = "default" }: SignInButtonProps) {
  const searchParams = useSearchParams();
  const club = searchParams.get("club");

  const handleSignIn = () => {
    // Preserve the club invite token in the callback URL so it's available after sign-in
    const callbackUrl = club
      ? `${window.location.origin}${window.location.pathname}?club=${club}`
      : undefined;
    signIn("keycloak", { callbackUrl });
  };

  return (
    <Button className={className} variant={variant} onClick={handleSignIn}>
      {children}
    </Button>
  );
}
