"use client";

import { usePathname, useRouter } from "@/i18n/routing";
import type { ChallengeInstance } from "@/lib/challenge-instances";
import { initializePWACache } from "@/lib/pwa-cache-utils";
import { useEffect } from "react";

interface PWARedirectHandlerProps {
  currentThemeKey?: string;
}

export function PWARedirectHandler({ currentThemeKey }: PWARedirectHandlerProps = {}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Initialize PWA cache management
    initializePWACache();

    // BRUTAL CHECK: If we're on a challenge page and it's after Dec 31st, force redirect immediately
    const now = new Date();
    const december31 = new Date(now.getFullYear(), 11, 31);

    console.log("[PWA-HANDLER] Checking redirect:", {
      pathname,
      currentDate: now.toISOString(),
      isAfterDec31: now >= december31,
      isChallengePage: pathname.match(/\/challenges\/[^\/]+/),
    });

    if (now >= december31 && pathname.match(/\/challenges\/[^\/]+/)) {
      console.log("[PWA-HANDLER] Redirecting challenge page to home");
      // This is a challenge detail page - redirect to home for proper routing
      router.replace("/");
      return;
    }

    const checkAndRedirect = async () => {
      try {
        // Check if we have a session by making a request to a protected endpoint
        const response = await fetch("/api/health", {
          method: "GET",
          credentials: "include",
        });

        if (response.ok) {
          // User is logged in
          // Only block December challenges after Dec 31st
          // This allows users to access valid January/February/etc challenges
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth(); // 0 = January
          const checkYear = currentMonth < 11 ? currentYear - 1 : currentYear; // If before December, check previous year
          const december31Check = new Date(checkYear, 11, 31); // Dec 31 of the relevant year

          const isDecemberChallenge =
            pathname.includes("december") || pathname.includes("christmas");

          if (
            now >= december31Check &&
            pathname.match(/\/challenges\/[^\/]+/) &&
            isDecemberChallenge
          ) {
            router.replace("/");
            return;
          }

          // Check if we should redirect from December to January (fallback if above doesn't catch it)
          if (now >= december31Check && currentThemeKey?.includes("december")) {
            // Use cached data if available and recent (5 minutes)
            const cachedData = localStorage.getItem("calendrun_active_challenge_cache");
            const cacheTime = localStorage.getItem("calendrun_last_challenge_check");
            let activeInstances: ChallengeInstance[] = [];

            if (cachedData && cacheTime) {
              const cacheAge = Date.now() - Number.parseInt(cacheTime);
              if (cacheAge < 5 * 60 * 1000) {
                // 5 minutes
                activeInstances = JSON.parse(cachedData);
              }
            }

            // Fetch fresh data if cache is stale
            if (activeInstances.length === 0) {
              const challengesResponse = await fetch("/api/challenges/instances", {
                method: "GET",
                credentials: "include",
              });

              if (challengesResponse.ok) {
                const data = await challengesResponse.json();
                activeInstances =
                  data.instances?.filter((inst: ChallengeInstance) => inst.status === "active") ||
                  [];

                // Cache the result
                localStorage.setItem(
                  "calendrun_active_challenge_cache",
                  JSON.stringify(activeInstances)
                );
                localStorage.setItem("calendrun_last_challenge_check", Date.now().toString());
              }
            }

            // BRUTAL: Find ANY non-December active challenge
            const nonDecemberInstance = activeInstances.find(
              (inst: ChallengeInstance) => !inst.themeKey.includes("december")
            );

            if (nonDecemberInstance) {
              // Store redirect intent to prevent loops
              const redirectKey = `redirect_${nonDecemberInstance.id}`;
              if (!sessionStorage.getItem(redirectKey)) {
                sessionStorage.setItem(redirectKey, "true");
                router.push(`/challenges/${nonDecemberInstance.id}`);
                return;
              }
            } else {
              // No non-December challenges available, redirect to home page for proper routing
              router.push("/");
              return;
            }
          }

          // Home page refresh for users with active challenges
          if (pathname === "/" && !currentThemeKey) {
            // Check if user has active challenges and should be redirected
            const cachedData = localStorage.getItem("calendrun_active_challenge_cache");
            if (cachedData) {
              const activeInstances = JSON.parse(cachedData);
              if (activeInstances.length > 0) {
                // Refresh to trigger server-side redirect logic
                window.location.reload();
              }
            }
          }
        }
      } catch {
        // Ignore errors - this is just a fallback
      }
    };

    // Run immediately and also after a short delay to catch edge cases
    checkAndRedirect();
    const timer = setTimeout(checkAndRedirect, 500);

    return () => clearTimeout(timer);
  }, [router, pathname, currentThemeKey]);

  return null; // This component doesn't render anything
}
