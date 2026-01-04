"use client";

import { clearPWACache, forcePWARefresh, isPWACacheStale } from "@/lib/pwa-cache-utils";
import { useState } from "react";

export default function PWACacheAdminPage() {
  const [isClearing, setIsClearing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<"checking" | "stale" | "current">("checking");

  // Check cache status on mount
  useState(() => {
    if (typeof window !== "undefined") {
      setCacheStatus(isPWACacheStale() ? "stale" : "current");
    }
  });

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      clearPWACache();
      // This will reload the page, so this code won't execute
    } catch (error) {
      console.error("Failed to clear cache:", error);
      setIsClearing(false);
    }
  };

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      forcePWARefresh();
      // This will reload the page, so this code won't execute
    } catch (error) {
      console.error("Failed to force refresh:", error);
      setIsRefreshing(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">PWA Cache Management</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manage PWA caching and force updates for users experiencing calendar switching issues.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium mb-4">Cache Status</h2>
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Status:</span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              cacheStatus === "stale"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
            }`}
          >
            {cacheStatus === "checking"
              ? "Checking..."
              : cacheStatus === "stale"
                ? "Cache is stale"
                : "Cache is current"}
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Clear PWA Cache</h3>
            <p className="text-xs text-zinc-500 mb-3">
              Clears all cached challenge data and forces a fresh reload. Use this for users stuck
              on old calendar views.
            </p>
            <button
              type="button"
              onClick={handleClearCache}
              disabled={isClearing}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {isClearing ? "Clearing..." : "Clear Cache & Reload"}
            </button>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Force PWA Refresh</h3>
            <p className="text-xs text-zinc-500 mb-3">
              Updates the cache version and reloads the PWA. Use this to push new redirect logic to
              existing installations.
            </p>
            <button
              type="button"
              onClick={handleForceRefresh}
              disabled={isRefreshing}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isRefreshing ? "Refreshing..." : "Force Refresh"}
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-zinc-50 rounded-md dark:bg-zinc-800/50">
          <h4 className="text-sm font-medium mb-2">For Users Experiencing Issues:</h4>
          <ol className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1 list-decimal list-inside">
            <li>Try the &quot;Clear Cache &amp; Reload&quot; button above</li>
            <li>If that doesn&apos;t work, use &quot;Force Refresh&quot;</li>
            <li>As a last resort, remove and reinstall the PWA from home screen</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
