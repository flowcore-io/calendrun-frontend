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

type NewUserOnboardingModalProps = {
  template: ChallengeTemplate;
  themeTokens: ThemeTokens;
  onJoinSuccess: (instanceId: string) => void;
};

async function joinChallenge(
  templateId: string,
  variant: Variant,
  inviteToken?: string
): Promise<{ ok: boolean; instanceId: string }> {
  const response = await fetch("/api/challenges/join", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ templateId, variant, inviteToken }),
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

export function NewUserOnboardingModal({
  template,
  themeTokens,
  onJoinSuccess,
}: NewUserOnboardingModalProps) {
  const router = useRouter();
  const locale = useLocale();
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [clubToken, setClubToken] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const t = useTranslations("onboarding");
  const tChallenges = useTranslations("challenges");
  const tNames = useTranslations("challengeNames");
  const tCommon = useTranslations("common");

  const joinMutation = useMutation({
    mutationFn: ({ variant, inviteToken }: { variant: Variant; inviteToken?: string }) =>
      joinChallenge(template.id, variant, inviteToken),
    onSuccess: (data) => {
      onJoinSuccess(data.instanceId);
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
        setJoinError(tChallenges("alreadyJoined"));
      } else {
        setJoinError(error.message || t("joinError"));
      }
    },
  });

  const handleJoin = () => {
    if (!selectedVariant) {
      setJoinError(t("selectVariantError"));
      return;
    }

    setJoinError(null);
    joinMutation.mutate({
      variant: selectedVariant,
      inviteToken: clubToken.trim() || undefined,
    });
  };

  // Get variants based on the number of days in the challenge
  const fractionVariants = getVariantsForDays(template.days);

  const startDate = new Date(template.startDate);
  const endDate = new Date(template.endDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900 max-h-[90vh] overflow-y-auto">
        {/* Theme accent bar */}
        <div className="h-1 w-full mb-4 rounded" style={{ backgroundColor: themeTokens.accent }} />

        {/* Header */}
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
            {t("title")}
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("description")}</p>
        </div>

        {/* Challenge info */}
        <div className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">
            {tNames.has(template.themeKey) ? tNames(template.themeKey) : template.name}
          </h3>
          <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">{template.description}</p>
          <div className="space-y-1 text-xs text-zinc-500 dark:text-zinc-500">
            <div suppressHydrationWarning>
              {`${formatLocaleDate(startDate, locale)} - ${formatLocaleDate(endDate, locale)}`}
            </div>
            <div>
              {template.days} {tCommon("days")}
            </div>
          </div>
        </div>

        {/* Variant selection */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {t("selectVariant")}
          </label>
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
              const displayName = getVariantDisplayNameCompact(variant);
              const isSelected = selectedVariant === variant;
              const isPrimary = variant === "8/8" || variant === "7/7" || variant === "5/5";

              return (
                <Button
                  key={variant}
                  onClick={() => setSelectedVariant(variant)}
                  variant={isSelected ? "default" : "outline"}
                  className="w-full min-w-[90px] px-2.5 py-2.5"
                  style={{
                    backgroundColor: isSelected
                      ? isPrimary
                        ? themeTokens.accent
                        : themeTokens.accentSoft
                      : undefined,
                    color: isSelected
                      ? isPrimary
                        ? themeTokens.background
                        : "#000000"
                      : undefined,
                    borderColor: isSelected ? undefined : themeTokens.border,
                  }}
                >
                  <span className="flex flex-col items-center justify-center gap-0.5 text-xs leading-tight">
                    <span className="whitespace-nowrap font-medium">{displayName}</span>
                    <span className="whitespace-nowrap font-semibold">
                      {totalKm} {tCommon("km")}
                    </span>
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Club token input */}
        <div className="mb-6">
          <label
            htmlFor="club-token"
            className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            {t("clubTokenLabel")} <span className="text-zinc-500">({tCommon("optional")})</span>
          </label>
          <input
            id="club-token"
            type="text"
            value={clubToken}
            onChange={(e) => setClubToken(e.target.value)}
            placeholder={t("clubTokenPlaceholder")}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-400"
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{t("clubTokenHelp")}</p>
        </div>

        {/* Error message */}
        {joinError && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-400">
            {joinError}
          </div>
        )}

        {/* Join button */}
        <div className="flex justify-end">
          <Button
            onClick={handleJoin}
            disabled={joinMutation.isPending || !selectedVariant}
            className="min-w-[120px]"
            style={{
              backgroundColor: themeTokens.accent,
              color: themeTokens.background,
            }}
          >
            {joinMutation.isPending ? t("joining") : t("joinButton")}
          </Button>
        </div>
      </div>
    </div>
  );
}
