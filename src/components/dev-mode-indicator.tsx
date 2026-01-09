"use client";

import { useEffect } from "react";

/**
 * Dev Mode Indicator Component
 * 
 * Displays a visual indicator when running in dev mode.
 * Only renders when NEXT_PUBLIC_DEV_MODE is true.
 */
export function DevModeIndicator() {
  // Check dev mode from environment variable (client-side)
  const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";

  useEffect(() => {
    if (isDevMode) {
      console.warn(
        "⚠️  DEV MODE ENABLED",
        "\n- Events will be sent to dev datacore (calendrun-dev)",
        "\n- Backend API:",
        process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:18765"
      );
    }
  }, [isDevMode]);

  // Only show in dev mode
  if (!isDevMode) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-yellow-500 px-3 py-1.5 text-xs font-semibold text-yellow-950 shadow-lg">
      <span className="mr-2">⚠️</span>
      DEV MODE
    </div>
  );
}
