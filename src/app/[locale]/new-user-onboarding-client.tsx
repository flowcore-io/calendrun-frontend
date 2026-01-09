"use client";

import { NewUserOnboardingModal } from "@/components/new-user-onboarding-modal";
import type { ChallengeTemplate } from "@/lib/challenge-templates";
import type { ChallengeInstance } from "@/lib/challenge-instances";
import type { ThemeTokens } from "@/theme/themes";
import { useState } from "react";

/**
 * Client-safe function to fetch a challenge instance
 * Uses fetch directly instead of backend-client to avoid server-only imports
 */
async function getChallengeInstanceClient(instanceId: string): Promise<ChallengeInstance | null> {
  try {
    const response = await fetch(`/api/challenges/${instanceId}`, {
      method: "GET",
      credentials: "include", // Include cookies for authentication
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    // Transform snake_case to camelCase (simplified version)
    const transformKeys = (obj: unknown): unknown => {
      if (obj === null || obj === undefined) return obj;
      if (Array.isArray(obj)) return obj.map(transformKeys);
      if (typeof obj === "object" && obj.constructor === Object) {
        const transformed: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
          const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
          transformed[camelKey] = transformKeys(value);
        }
        return transformed;
      }
      return obj;
    };

    return transformKeys(data) as ChallengeInstance;
  } catch {
    return null;
  }
}

type NewUserOnboardingClientProps = {
  template: ChallengeTemplate;
  themeTokens: ThemeTokens;
  locale: string;
};

export function NewUserOnboardingClient({
  template,
  themeTokens,
  locale,
}: NewUserOnboardingClientProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleJoinSuccess = async (instanceId: string) => {
    setIsRedirecting(true);
    
    // Poll for the instance to be available (Flowcore events are processed asynchronously)
    // Increased attempts and interval to account for event processing delay
    const maxAttempts = 30; // Increased to 30 attempts
    const pollInterval = 1000; // 1 second between attempts (total max wait: 30 seconds)
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const instance = await getChallengeInstanceClient(instanceId);
        if (instance) {
          // Instance is available, wait a bit more to ensure backend has fully processed it
          // and the database is consistent
          await new Promise((resolve) => setTimeout(resolve, 1000));
          // Redirect with a flag to indicate we just created this
          window.location.href = `/${locale}/challenges/${instanceId}?new=true`;
          return;
        }
      } catch {
        // Instance not found yet, continue polling
        console.log(`[Onboarding] Instance not available yet, attempt ${attempt + 1}/${maxAttempts}`);
      }
      
      // Wait before next attempt (except on last attempt)
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
    }
    
    // If we've exhausted all attempts, redirect anyway
    // The user will see an error, but they can refresh or go back
    console.warn(`[Onboarding] Instance ${instanceId} not available after ${maxAttempts} attempts, redirecting anyway`);
    window.location.href = `/${locale}/challenges/${instanceId}?new=true`;
  };

  return (
    <>
      <NewUserOnboardingModal
        template={template}
        themeTokens={themeTokens}
        onJoinSuccess={handleJoinSuccess}
      />
      {isRedirecting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
            <p className="text-sm text-zinc-900 dark:text-zinc-100">
              Setting up your challenge...
            </p>
          </div>
        </div>
      )}
    </>
  );
}
