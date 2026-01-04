"use client";

import { useRouter } from "@/i18n/routing";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface AbandonChallengeProps {
  instanceId: string;
  challengeName: string;
}

async function abandonChallenge(instanceId: string): Promise<{ ok: boolean }> {
  const response = await fetch(`/api/challenges/${instanceId}/abandon`, {
    method: "POST",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to abandon challenge");
  }

  return data;
}

export function AbandonChallenge({ instanceId, challengeName }: AbandonChallengeProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const t = useTranslations("abandon");
  const tCommon = useTranslations("common");

  const abandonMutation = useMutation({
    mutationFn: () => abandonChallenge(instanceId),
    onSuccess: () => {
      setShowConfirm(false);
      router.push("/");
      router.refresh();
    },
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
      >
        {t("title")}
      </button>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                role="img"
                aria-label="Warning"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {t("confirmTitle", { challengeName })}
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("confirmDesc")}</p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={abandonMutation.isPending}
                className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {tCommon("cancel")}
              </button>
              <button
                type="button"
                onClick={() => abandonMutation.mutate()}
                disabled={abandonMutation.isPending}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {abandonMutation.isPending ? t("abandoning") : t("yesAbandon")}
              </button>
            </div>

            {abandonMutation.isError && (
              <p className="mt-3 text-center text-sm text-red-600 dark:text-red-400">
                {abandonMutation.error?.message || t("failedToAbandon")}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
