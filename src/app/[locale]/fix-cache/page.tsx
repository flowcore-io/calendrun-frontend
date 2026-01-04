"use client";

import { clearPWACache, forcePWARefresh } from "@/lib/pwa-cache-utils";
import Link from "next/link";
import { useState } from "react";

export default function FixCachePage() {
  const [isClearing, setIsClearing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    <main className="mx-auto flex max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Fix Calendar Display Issues</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          If you&apos;re seeing the wrong calendar (like December instead of January), try these
          fixes.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Quick Fix</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Clear cached data and reload the app. This usually fixes calendar switching issues.
            </p>
            <button
              type="button"
              onClick={handleClearCache}
              disabled={isClearing}
              className="w-full rounded-md bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isClearing ? "Clearing Cache..." : "Clear Cache & Reload"}
            </button>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Force Refresh</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Update the app and clear all cached data. Use this if the quick fix doesn&apos;t work.
            </p>
            <button
              type="button"
              onClick={handleForceRefresh}
              disabled={isRefreshing}
              className="w-full rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {isRefreshing ? "Refreshing..." : "Force Refresh"}
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-amber-50 rounded-md dark:bg-amber-900/20">
          <h4 className="text-sm font-medium text-amber-800 dark:text-amber-400 mb-2">
            Still having issues?
          </h4>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            If neither option works, try removing the CalendRun app from your home screen and
            reinstalling it. Go to your browser settings and clear site data for calendrun.com as a
            last resort.
          </p>
        </div>
      </div>

      <div className="text-center">
        <Link
          href="/"
          className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          ← Back to CalendRun
        </Link>
      </div>
    </main>
  );
}
