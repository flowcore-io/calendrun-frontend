"use client";

import { Link } from "@/i18n/routing";
import type { ChallengeTemplate } from "@/lib/challenge-templates";
import { formatLocaleDate } from "@/lib/date-utils";
import { resolveTheme } from "@/theme/themes";
import { useLocale, useTranslations } from "next-intl";
import { useState, useEffect } from "react";

type CurrentChallengeStatusProps = {
  challenge: ChallengeTemplate;
};

export function CurrentChallengeStatus({ challenge }: CurrentChallengeStatusProps) {
  const locale = useLocale();
  const [isMounted, setIsMounted] = useState(false);
  const t = useTranslations("everybody");
  const tCommon = useTranslations("common");
  const tNames = useTranslations("challengeNames");

  // Ensure dates are only rendered on client to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { tokens } = resolveTheme(challenge.themeKey);
  const startDate = new Date(challenge.startDate);
  const endDate = new Date(challenge.endDate);
  const now = new Date();

  const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysTotal = challenge.days;
  const daysRemaining = Math.max(0, daysTotal - daysElapsed);
  const progressPercentage = Math.round((daysElapsed / daysTotal) * 100);

  return (
    <div className="relative overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Theme accent bar */}
      <div className="h-1 w-full" style={{ backgroundColor: tokens.accent }} />

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
              {tCommon("active")}
            </span>
            <span className="text-xs font-medium" style={{ color: tokens.accent }}>
              {challenge.themeKey.replace("_", " ")}
            </span>
          </div>
          <Link
            href="/challenges"
            className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 underline"
          >
            {t("viewChallenges")}
          </Link>
        </div>

        <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">
          {tNames.has(challenge.themeKey) ? tNames(challenge.themeKey) : challenge.name}
        </h3>

        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">{challenge.description}</p>

        {/* Progress information */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-500">
            <span>{t("daysElapsed", { days: daysElapsed, total: daysTotal })}</span>
            <span>{t("daysRemaining", { days: daysRemaining })}</span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-zinc-200 rounded-full h-2 dark:bg-zinc-700">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.max(0, progressPercentage))}%`,
                backgroundColor: tokens.accent,
              }}
            />
          </div>

          <div className="text-center text-xs font-medium" style={{ color: tokens.accent }}>
            {progressPercentage}% {t("complete")}
          </div>
        </div>

        {/* Date range */}
        <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
          {isMounted
            ? `${formatLocaleDate(startDate, locale)} - ${formatLocaleDate(endDate, locale)}`
            : `${startDate.toISOString().split("T")[0]} - ${endDate.toISOString().split("T")[0]}`}
        </div>
      </div>
    </div>
  );
}
