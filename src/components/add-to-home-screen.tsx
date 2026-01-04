"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function AddToHomeScreen() {
  const t = useTranslations("pwa");
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if running on client
    if (typeof window === "undefined") return;

    // Check if already in standalone mode (installed)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ||
      document.referrer.includes("android-app://");

    if (isStandalone) return;

    // Check if user agent is iOS
    const userAgent = window.navigator.userAgent;
    const isIOS =
      /iPad|iPhone|iPod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;

    // Check if browser is Safari (to be more specific, though usually iOS implies Safari or WebKit)
    // We want to target native Safari because the instructions (share button at bottom) are specific to it
    const isSafari = /Safari/.test(userAgent) && !/CriOS|FxiOS|OPiOS|mercury/.test(userAgent);

    // Check if previously dismissed
    const isDismissed = localStorage.getItem("addToHomeScreenDismissed");

    if (isIOS && isSafari && !isDismissed) {
      // Defer state update to next tick to avoid synchronous setState in effect
      setTimeout(() => setShowPrompt(true), 0);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("addToHomeScreenDismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/95 p-4 shadow-lg backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95 safe-area-pb">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            <p className="mb-2 font-medium text-zinc-900 dark:text-zinc-100">{t("installTitle")}</p>
            <p className="flex flex-wrap items-center gap-1 leading-normal">
              {t("installStep1")}
              <span className="inline-flex items-center justify-center rounded bg-zinc-100 p-1 dark:bg-zinc-800">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-blue-500"
                  aria-hidden="true"
                >
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </span>
              {t("installStep2")}
              <span className="inline-flex items-center justify-center rounded bg-zinc-100 p-1 dark:bg-zinc-800">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-zinc-900 dark:text-zinc-100"
                  aria-hidden="true"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </span>
              {t("installStep3")}
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="shrink-0 rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label={t("dismiss")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {/* Triangle pointer pointing down to the share button area roughly */}
        <div className="absolute -bottom-2 left-1/2 hidden h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:block" />
      </div>
    </div>
  );
}
