"use client";

import { useRouter } from "@/i18n/routing";
import {
  type Variant,
  getVariantDisplayName,
  getVariantDisplayNameCompact,
  getVariantsForDays,
  variantToMultiplier,
} from "@/lib/variant-utils";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface VariantSwitcherProps {
  instanceId: string;
  currentVariant: Variant;
  fullDistanceTotalKm: number;
  days: number;
}

async function switchVariant(instanceId: string, variant: Variant): Promise<{ ok: boolean }> {
  const response = await fetch(`/api/challenges/${instanceId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ variant }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorData = {
      error: data.error || "Failed to switch variant",
      details: data.details || [],
    };
    throw new Error(JSON.stringify(errorData));
  }

  return data;
}

export function VariantSwitcher({
  instanceId,
  currentVariant,
  fullDistanceTotalKm,
  days,
}: VariantSwitcherProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetVariant, setTargetVariant] = useState<Variant>(currentVariant);
  const t = useTranslations("variant");
  const tCommon = useTranslations("common");

  // Get available variants for this number of days
  const availableVariants = getVariantsForDays(days);

  const switchMutation = useMutation({
    mutationFn: ({ variant }: { variant: Variant }) => switchVariant(instanceId, variant),
    onSuccess: () => {
      setShowConfirm(false);
      router.refresh();
    },
  });

  const handleVariantClick = (variant: Variant) => {
    if (variant === currentVariant) return;
    setTargetVariant(variant);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    switchMutation.mutate({ variant: targetVariant });
  };

  // Calculate grid columns based on number of variants
  const getGridCols = (count: number) => {
    if (count <= 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2";
    if (count <= 6) return "grid-cols-3";
    if (count <= 8) return "grid-cols-4";
    return "grid-cols-4";
  };

  // Get display name for current variant
  const getCurrentVariantDisplayName = () => {
    if (t.has(currentVariant)) {
      return t(currentVariant);
    }
    return getVariantDisplayName(currentVariant, "en");
  };

  // Get display name for target variant
  const getTargetVariantDisplayName = () => {
    if (t.has(targetVariant)) {
      return t(targetVariant);
    }
    return getVariantDisplayName(targetVariant, "en");
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{t("title")}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {t("currently")} {getCurrentVariantDisplayName()}
        </span>
      </div>

      <div className={`grid ${getGridCols(availableVariants.length)} gap-3`}>
        {availableVariants.map((variant) => {
          const multiplier = variantToMultiplier(variant);
          const distanceKm = Math.ceil(fullDistanceTotalKm * multiplier);
          const displayName = getVariantDisplayNameCompact(variant);
          const isSelected = variant === currentVariant;

          return (
            <button
              type="button"
              key={variant}
              onClick={() => handleVariantClick(variant)}
              disabled={switchMutation.isPending}
              className={`rounded-lg border-2 p-4 text-left transition-all ${
                isSelected
                  ? "border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-900/20"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
              }`}
            >
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {t.has(variant) ? t(variant) : displayName}
              </div>
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {distanceKm} {tCommon("km")}
              </div>
              {isSelected && (
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
                  {t("active")}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {t("switch")} to {getTargetVariantDisplayName()}?
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {t("switchDesc", {
                variant: getTargetVariantDisplayName().toLowerCase(),
              })}
            </p>

            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={switchMutation.isPending}
                className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {tCommon("cancel")}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={switchMutation.isPending}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {switchMutation.isPending ? t("switching") : t("switch")}
              </button>
            </div>

            {switchMutation.isError && (
              <div className="mt-3 text-center text-sm text-red-600 dark:text-red-400">
                {(() => {
                  try {
                    const error = JSON.parse(switchMutation.error.message);
                    if (error.error === "VALIDATION_ERROR") {
                      return (
                        <>
                          <p className="mb-2 font-semibold">{t("validationError")}</p>
                          <ul className="list-inside list-disc text-xs text-left">
                            {error.details.map(
                              (
                                detail: {
                                  dayNumber: number;
                                  date: string;
                                  actualDistance: number;
                                  requiredDistance: number;
                                },
                                i: number
                              ) => (
                                <li key={`validation-detail-${detail.dayNumber}-${detail.date}`}>
                                  {t("validationIssue", {
                                    day: detail.dayNumber,
                                    date: detail.date,
                                    actual: detail.actualDistance,
                                    required: detail.requiredDistance,
                                  })}
                                </li>
                              )
                            )}
                          </ul>
                        </>
                      );
                    }
                    return error.error;
                  } catch {
                    return switchMutation.error?.message || t("failedToSwitch");
                  }
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
