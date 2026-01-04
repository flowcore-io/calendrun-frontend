"use client";

import { ChallengeBackground } from "@/components/challenge-background";
import { useRouter } from "@/i18n/routing";
import type { ChallengeTemplate } from "@/lib/challenge-templates";
import {
  type Variant,
  getVariantDisplayNameCompact,
  getVariantsForDays,
  variantToMultiplier,
} from "@/lib/variant-utils";
import { resolveTheme } from "@/theme/themes";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { formatDate } from "@/lib/date-utils";

interface TokenValidationResult {
  valid: boolean;
  clubName?: string;
  clubId?: string;
  error?: string;
  remainingAttempts?: number;
  rateLimited?: boolean;
  minutesRemaining?: number;
}

async function validateInviteToken(token: string): Promise<TokenValidationResult> {
  const response = await fetch("/api/challenges/validate-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  const data = await response.json();

  if (response.status === 429) {
    return {
      valid: false,
      rateLimited: true,
      minutesRemaining: data.minutesRemaining,
      error: data.error,
    };
  }

  if (!response.ok) {
    return {
      valid: false,
      error: data.error,
      remainingAttempts: data.remainingAttempts,
    };
  }

  return {
    valid: true,
    clubName: data.clubName,
    clubId: data.clubId,
  };
}

interface ChallengeSelectorProps {
  template: ChallengeTemplate;
}

async function joinChallenge(
  templateId: string,
  variant: Variant,
  inviteToken: string
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

export function ChallengeSelector({ template }: ChallengeSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [inviteToken, setInviteToken] = useState(searchParams.get("club") || "");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [skipped, setSkipped] = useState(false);
  const [tokenValidation, setTokenValidation] = useState<TokenValidationResult | null>(null);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const t = useTranslations("challenges");
  const tNames = useTranslations("challengeNames");
  const tCommon = useTranslations("common");

  const { tokens } = resolveTheme(template.themeKey);
  const hasBackground = !!tokens.backgroundImageDesktop;

  // Localized name or fallback to template name
  const challengeName = tNames.has(template.themeKey) ? tNames(template.themeKey) : template.name;

  // Get variants based on the number of days in the challenge
  const variants = getVariantsForDays(template.days);

  const joinMutation = useMutation({
    mutationFn: ({ variant }: { variant: Variant }) =>
      joinChallenge(template.id, variant, inviteToken),
    onSuccess: (data) => {
      router.push(`/challenges/${data.instanceId}?new=true`);
    },
    onError: (error: Error & { instanceId?: string }) => {
      if (error.instanceId) {
        router.push(`/challenges/${error.instanceId}`);
      } else {
        setJoinError(error.message || "Failed to join challenge");
      }
    },
  });

  const handleJoin = async () => {
    if (!selectedVariant) return;
    setJoinError(null);

    // If token is provided, validate it first before attempting to join
    if (inviteToken.trim()) {
      setIsValidatingToken(true);
      try {
        const result = await validateInviteToken(inviteToken.trim());
        setTokenValidation(result);

        if (!result.valid) {
          // Token is invalid, don't proceed with join
          setIsValidatingToken(false);
          return;
        }

        // Token is valid, proceed with join
        setIsValidatingToken(false);
        joinMutation.mutate({ variant: selectedVariant });
      } catch {
        setTokenValidation({ valid: false, error: "Failed to validate token" });
        setIsValidatingToken(false);
      }
    } else {
      // No token provided, proceed directly
      joinMutation.mutate({ variant: selectedVariant });
    }
  };

  // If user skipped, show a different view
  if (skipped) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <svg
              className="h-8 w-8 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {t("noChallengeSelected")}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("joinWhenReady")}</p>
          <button
            type="button"
            onClick={() => setSkipped(false)}
            className="mt-6 rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white hover:bg-emerald-700"
          >
            {t("chooseChallenge")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ChallengeBackground
        backgroundImageDesktop={tokens.backgroundImageDesktop}
        backgroundImageMobile={tokens.backgroundImageMobile}
      />
      <div className="relative z-10 flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1
              className={`text-2xl font-bold tracking-tight sm:text-3xl ${
                hasBackground ? "text-white drop-shadow-md" : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              {challengeName}
            </h1>
            <p
              className={`mt-2 text-sm ${
                hasBackground ? "text-zinc-100 drop-shadow-sm" : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {t("chooseChallengeLevel")}
            </p>
          </div>

          {/* Variant options */}
          <div
            className={`mb-6 grid gap-3 ${
              variants.length <= 4
                ? "grid-cols-2 sm:grid-cols-4"
                : variants.length <= 5
                  ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
                  : variants.length <= 7
                    ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7"
                    : "grid-cols-2 sm:grid-cols-4"
            }`}
          >
            {variants.map((variant) => {
              const multiplier = variantToMultiplier(variant);
              const distanceKm = Math.round(template.fullDistanceTotalKm * multiplier);
              // Use compact notation (fractions) to save space
              const displayName = getVariantDisplayNameCompact(variant);
              const isSelected = selectedVariant === variant;

              return (
                <button
                  type="button"
                  key={variant}
                  onClick={() => setSelectedVariant(variant)}
                  disabled={joinMutation.isPending}
                  className={`group relative min-w-0 overflow-hidden rounded-lg border-2 p-4 text-left transition-all ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-900/20"
                      : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
                  }`}
                >
                  {/* Checkmark indicator */}
                  {isSelected && (
                    <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}

                  <div className="mb-2 min-w-0 pr-6">
                    <span
                      className="truncate text-xs font-semibold text-zinc-700 dark:text-zinc-300"
                      title={displayName}
                    >
                      {displayName}
                    </span>
                  </div>
                  <div className="break-words text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    {distanceKm} {tCommon("km")}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Challenge info */}
          <div className="mb-6 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">{t("duration")}</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {template.days} {tCommon("days")}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">{t("dates")}</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {formatDate(template.startDate)} - {formatDate(template.endDate)}
              </span>
            </div>
          </div>

          {/* Club Invite Token */}
          <div className="mb-6">
            <label
              htmlFor="inviteToken"
              className={`mb-2 block text-sm font-medium ${
                hasBackground ? "text-white drop-shadow-sm" : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {t("clubInviteToken")} <span className="text-zinc-400">({tCommon("optional")})</span>
            </label>
            <div className="relative">
              <input
                type="text"
                id="inviteToken"
                value={inviteToken}
                onChange={(e) => {
                  setInviteToken(e.target.value);
                  // Clear validation when user types (they haven't submitted yet)
                  if (tokenValidation) {
                    setTokenValidation(null);
                  }
                }}
                placeholder={t("clubInviteTokenPlaceholder")}
                disabled={
                  joinMutation.isPending || isValidatingToken || tokenValidation?.rateLimited
                }
                className={`w-full rounded-xl border-2 bg-white px-4 py-3 pr-10 text-zinc-900 outline-none transition-all placeholder:text-zinc-400 disabled:opacity-50 dark:bg-zinc-900 dark:text-zinc-100 ${
                  tokenValidation?.valid === true
                    ? "border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    : tokenValidation?.valid === false
                      ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-400/20"
                      : "border-zinc-200 dark:border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                }`}
              />
              {/* Validation status indicator - only shown after validation attempt */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {tokenValidation?.valid && (
                  <svg
                    className="h-5 w-5 text-emerald-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
                {tokenValidation?.valid === false && (
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </div>
            </div>
            {/* Token validation feedback */}
            {tokenValidation &&
              (() => {
                const v = tokenValidation;

                if (v && v.valid === true && v.clubName) {
                  return (
                    <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                      ✓ {t("joiningClub", { clubName: v.clubName })}
                    </p>
                  );
                }

                if (v.valid === false && !v.rateLimited) {
                  const remainingAttempts = v.remainingAttempts ?? 0;
                  return (
                    <p className="mt-2 text-sm text-red-500 dark:text-red-400">
                      {t("invalidToken")}
                      {remainingAttempts > 0 && (
                        <span className="ml-1 text-xs text-zinc-500">
                          ({t("attemptsRemaining", { count: remainingAttempts })})
                        </span>
                      )}
                    </p>
                  );
                }

                if (v.rateLimited) {
                  return (
                    <p className="mt-2 text-sm text-red-500 dark:text-red-400">
                      {t("rateLimited", { minutes: v.minutesRemaining ?? 0 })}
                    </p>
                  );
                }

                return null;
              })()}
          </div>

          {/* Start button */}
          <button
            type="button"
            onClick={handleJoin}
            disabled={
              !selectedVariant ||
              joinMutation.isPending ||
              isValidatingToken ||
              tokenValidation?.rateLimited
            }
            className="w-full rounded-xl px-6 py-4 text-lg font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              backgroundColor:
                selectedVariant && !tokenValidation?.rateLimited ? tokens.accent : "#a1a1aa",
            }}
          >
            {joinMutation.isPending || isValidatingToken ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {isValidatingToken ? t("validating") : t("joining")}
              </span>
            ) : selectedVariant ? (
              t("selectChallengeLevel")
            ) : (
              t("selectChallengeLevel")
            )}
          </button>

          {/* Maybe later button */}
          <button
            type="button"
            onClick={() => setSkipped(true)}
            disabled={joinMutation.isPending}
            className="mt-3 w-full rounded-xl px-6 py-3 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            {t("maybeLater")}
          </button>

          {/* Error message */}
          {joinError && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-800 dark:bg-red-900/30 dark:text-red-400">
              {joinError}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
