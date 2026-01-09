"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";
import type { ChallengeTemplate } from "@/lib/challenge-templates";
import { formatLocaleDate } from "@/lib/date-utils";
import {
  type Variant,
  getVariantDisplayNameCompact,
  getVariantsForDays,
  variantToMultiplier,
} from "@/lib/variant-utils";
import type { ThemeTokens } from "@/theme/themes";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

type ChallengeJoinCardProps = {
  template: ChallengeTemplate;
  themeTokens: ThemeTokens;
  isActive: boolean;
  isUpcoming: boolean;
  isPast: boolean;
};

async function joinChallenge(
  templateId: string,
  variant: Variant
): Promise<{ ok: boolean; instanceId: string }> {
  const response = await fetch("/api/challenges/join", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ templateId, variant }),
  });

  const data = await response.json();

  if (!response.ok) {
    // If user already has an active instance, include instanceId in error
    if (response.status === 409 && data.instanceId) {
      const error = new Error(data.error || "Already joined") as Error & {
        instanceId?: string;
      };
      error.instanceId = data.instanceId;
      throw error;
    }
    throw new Error(data.error || "Failed to join challenge");
  }

  return data;
}

export function ChallengeJoinCard({
  template,
  themeTokens,
  isActive,
  isUpcoming,
  isPast,
}: ChallengeJoinCardProps) {
  const router = useRouter();
  const locale = useLocale();
  const [joinError, setJoinError] = useState<string | null>(null);
  const t = useTranslations("challenges");
  const tNames = useTranslations("challengeNames");
  const tCommon = useTranslations("common");

  // Ensure dates are only rendered on client to avoid hydration mismatch
  const isMounted = typeof window !== "undefined";

  const joinMutation = useMutation({
    mutationFn: ({ variant }: { variant: Variant }) => joinChallenge(template.id, variant),
    onSuccess: (data) => {
      // Redirect to the newly created challenge calendar with a flag to show welcome modal
      router.push(`/challenges/${data.instanceId}?new=true`);
    },
    onError: (error: Error & { instanceId?: string }) => {
      // Handle specific error cases
      if (error.instanceId) {
        // User already has an active instance - redirect to it
        router.push(`/challenges/${error.instanceId}`);
      } else if (
        error.message.includes("already have an active instance") ||
        error.message.includes("Already joined")
      ) {
        setJoinError(t("alreadyJoined"));
      } else {
        setJoinError(error.message || "Failed to join challenge");
      }
    },
  });

  const handleJoin = (variant: Variant) => {
    setJoinError(null);
    joinMutation.mutate({ variant });
  };

  // Get variants based on the number of days in the challenge
  const fractionVariants = getVariantsForDays(template.days);

  const startDate = new Date(template.startDate);
  const endDate = new Date(template.endDate);

  return (
    <div
      className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
      style={{
        borderColor: isActive ? themeTokens.accent : undefined,
      }}
    >
      {/* Theme accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: themeTokens.accent }} />

      <div className="p-5">
        {/* Status badge */}
        <div className="mb-3 flex items-center justify-between">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              isActive
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                : isUpcoming
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {isActive ? tCommon("active") : isUpcoming ? tCommon("upcoming") : tCommon("past")}
          </span>
          <span className="text-xs font-medium" style={{ color: themeTokens.accent }}>
            {template.themeKey.replace("_", " ")}
          </span>
        </div>

        {/* Template info */}
        <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">
          {tNames.has(template.themeKey) ? tNames(template.themeKey) : template.name}
        </h3>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">{template.description}</p>

        {/* Date range */}
        <div className="mb-4 space-y-1 text-xs text-zinc-500 dark:text-zinc-500">
          <div>
            {isMounted
              ? `${formatLocaleDate(startDate, locale)} - ${formatLocaleDate(endDate, locale)}`
              : `${startDate.toISOString().split("T")[0]} - ${endDate.toISOString().split("T")[0]}`}
          </div>
          <div>
            {template.days} {tCommon("days")}
          </div>
        </div>

        {/* Join buttons */}
        <div
          className={`grid gap-2 ${
            fractionVariants.length <= 4
              ? "grid-cols-2 sm:grid-cols-4"
              : fractionVariants.length <= 5
                ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
                : fractionVariants.length <= 7
                  ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7"
                  : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-4"
          }`}
        >
          {fractionVariants.map((variant) => {
            const totalKm = Math.ceil(template.fullDistanceTotalKm * variantToMultiplier(variant));
            // Use compact notation (fractions) for buttons to save space
            const displayName = getVariantDisplayNameCompact(variant);
            const isPrimary = variant === "8/8"; // Highlight full calendar

            return (
              <Button
                key={variant}
                onClick={() => handleJoin(variant)}
                disabled={joinMutation.isPending || isPast}
                variant={isPrimary ? "default" : "outline"}
                className="w-full min-w-[90px] px-2.5 py-2.5"
                style={{
                  backgroundColor: isPrimary ? themeTokens.accent : undefined,
                  color: isPrimary ? themeTokens.background : undefined,
                  borderColor: isPrimary ? undefined : themeTokens.border,
                }}
              >
                {joinMutation.isPending ? (
                  <span className="truncate text-xs">{t("joining")}</span>
                ) : (
                  <span className="flex flex-col items-center justify-center gap-0.5 text-xs leading-tight">
                    <span className="whitespace-nowrap font-medium">{displayName}</span>
                    <span className="whitespace-nowrap font-semibold">
                      {totalKm} {tCommon("km")}
                    </span>
                  </span>
                )}
              </Button>
            );
          })}
        </div>

        {/* Error message */}
        {joinError && (
          <div className="mt-3 rounded-md bg-red-50 p-2 text-xs text-red-800 dark:bg-red-900/30 dark:text-red-400">
            {joinError}
          </div>
        )}
      </div>
    </div>
  );
}
