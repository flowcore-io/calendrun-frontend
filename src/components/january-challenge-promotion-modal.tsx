"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";
import type { ChallengeTemplate } from "@/lib/challenge-templates";
import {
  type Variant,
  getVariantDisplayName,
  getVariantDisplayNameCompact,
  getVariantsForDays,
  variantToMultiplier,
} from "@/lib/variant-utils";
import { useMutation } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

interface JanuaryChallengePromotionModalProps {
  template: ChallengeTemplate;
  onClose: () => void;
}

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

export function JanuaryChallengePromotionModal({
  template,
  onClose,
}: JanuaryChallengePromotionModalProps) {
  const router = useRouter();
  const locale = useLocale();
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const t = useTranslations("challenges");
  const tVariant = useTranslations("variant");
  const tCommon = useTranslations("common");
  const tPromo = useTranslations("januaryPromotion");

  // Helper to get join button text
  const getJoinButtonText = () => {
    if (joinMutation.isPending) {
      return t("joining");
    }
    if (!selectedVariant) {
      return tPromo("selectDistance");
    }
    const variantName = getVariantDisplayName(selectedVariant, locale);
    // Construct the text by combining the base translation with the variant name
    return `${tPromo("joinJanuary")} (${variantName})`;
  };

  const joinMutation = useMutation({
    mutationFn: ({ variant }: { variant: Variant }) => joinChallenge(template.id, variant),
    onSuccess: (data) => {
      // Redirect to the newly created January challenge
      router.push(`/challenges/${data.instanceId}?new=true`);
    },
    onError: (error: Error & { instanceId?: string }) => {
      console.log("Join error:", error, "instanceId:", error.instanceId);
      if (error.instanceId) {
        // User already has an active instance - redirect to it
        setJoinError(t("alreadyJoinedRedirecting"));
        // Give user time to see the message, then redirect
        setTimeout(() => {
          onClose();
          router.push(`/challenges/${error.instanceId}`);
        }, 1500);
      } else {
        setJoinError(error.message || t("alreadyJoined"));
      }
    },
  });

  const handleJoin = () => {
    if (!selectedVariant) return;
    setJoinError(null);
    joinMutation.mutate({ variant: selectedVariant });
  };

  // Get variants based on the number of days in the challenge
  const fractionVariants = getVariantsForDays(template.days);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{tPromo("title")}</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{tPromo("description")}</p>
        </div>

        {/* Variant selection */}
        <div className="mb-6">
          <p className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {tPromo("selectDistance")}
          </p>
          <div
            className={`grid gap-3 ${
              fractionVariants.length <= 4
                ? "grid-cols-2 sm:grid-cols-4"
                : fractionVariants.length <= 5
                  ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
                  : fractionVariants.length <= 7
                    ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7"
                    : "grid-cols-2 sm:grid-cols-4"
            }`}
          >
            {fractionVariants.map((variant) => {
              const totalKm = Math.ceil(
                template.fullDistanceTotalKm * variantToMultiplier(variant)
              );
              // Use compact notation (fractions) to save space
              const displayName = getVariantDisplayNameCompact(variant);

              return (
                <button
                  type="button"
                  key={variant}
                  onClick={() => setSelectedVariant(variant)}
                  disabled={joinMutation.isPending}
                  className={`min-w-0 rounded-lg border-2 p-3 text-left transition-all ${
                    selectedVariant === variant
                      ? "border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-900/20"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                  }`}
                >
                  <div
                    className="truncate text-xs font-medium text-zinc-500 dark:text-zinc-400"
                    title={displayName}
                  >
                    {displayName}
                  </div>
                  <div className="break-words text-base font-semibold text-zinc-900 dark:text-zinc-100">
                    {totalKm} {tCommon("km")}
                  </div>
                  {selectedVariant === variant && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {tVariant("active")}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {joinError && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-400">
            {joinError}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            disabled={joinMutation.isPending}
            variant="outline"
            className="flex-1"
          >
            {tPromo("maybeLater")}
          </Button>
          <Button
            onClick={handleJoin}
            disabled={!selectedVariant || joinMutation.isPending}
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {getJoinButtonText()}
          </Button>
        </div>
      </div>
    </div>
  );
}
