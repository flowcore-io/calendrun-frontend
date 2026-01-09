"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ChallengeInstance } from "@/lib/challenge-instances";

/**
 * Client-safe function to fetch a challenge instance
 */
async function getChallengeInstanceClient(instanceId: string): Promise<ChallengeInstance | null> {
  try {
    const response = await fetch(`/api/challenges/${instanceId}`, {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    // Transform snake_case to camelCase
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

type ChallengeInstanceRetryProps = {
  instanceId: string;
  children: React.ReactNode;
};

/**
 * Client component that retries fetching the challenge instance if it's not found initially
 * This handles the case where the instance was just created and isn't available yet
 */
export function ChallengeInstanceRetry({ instanceId, children }: ChallengeInstanceRetryProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const isNew = searchParams.get("new") === "true";

  useEffect(() => {
    // Only retry if this is a newly created instance
    if (!isNew) {
      return;
    }

    const checkInstance = async () => {
      setIsRetrying(true);
      
      const maxRetries = 20;
      const retryInterval = 1000; // 1 second
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        setRetryCount(attempt + 1);
        
        const instance = await getChallengeInstanceClient(instanceId);
        if (instance) {
          // Instance is available, refresh the page to load it properly
          setIsRetrying(false);
          // Remove the 'new' param and refresh
          const newUrl = window.location.pathname;
          router.replace(newUrl);
          return;
        }
        
        // Wait before next attempt
        if (attempt < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, retryInterval));
        }
      }
      
      // If we've exhausted all retries, stop retrying
      setIsRetrying(false);
    };

    checkInstance();
  }, [instanceId, isNew, router]);

  if (isRetrying) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Setting up your challenge...
          </p>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Please wait while we prepare everything ({retryCount}/20)
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
