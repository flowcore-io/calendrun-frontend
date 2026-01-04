"use client";

import type { ClubRunPerformance } from "@/lib/run-performances";
import { formatDate, formatTime } from "@/lib/date-utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

type ClubRecentRunsProps = {
  initialRuns: ClubRunPerformance[];
  clubIds: string[];
};

export function ClubRecentRuns({ initialRuns, clubIds }: ClubRecentRunsProps) {
  const [runs, setRuns] = useState<ClubRunPerformance[]>(initialRuns);
  const [displayCount, setDisplayCount] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [loadMoreIncrement, setLoadMoreIncrement] = useState(20);
  const [hasMoreRuns, setHasMoreRuns] = useState(true); // Assume there are more runs initially
  const t = useTranslations("calendar");

  if (runs.length === 0) {
    return null;
  }

  const displayedRuns = runs.slice(0, displayCount);
  // Show button if we have more runs to display OR if we haven't confirmed there are no more
  const hasMore = hasMoreRuns;

  const handleLoadMore = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Calculate how many runs we need to fetch total
      const totalNeeded = displayCount + loadMoreIncrement;
      
      // Fetch more runs from all clubs
      const allClubRuns = await Promise.all(
        clubIds.map(async (clubId) => {
          const response = await fetch(
            `/api/clubs/${clubId}/runs?limit=${totalNeeded}&status=completed`
          );
          if (!response.ok) return [];
          const data = await response.json();
          return data.runs || [];
        })
      );

      // Combine all runs and sort by created_at descending
      const combinedRuns = allClubRuns.flat();
      const sortedRuns = combinedRuns.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });

      // Remove duplicates based on run ID
      const uniqueRuns = sortedRuns.filter(
        (run, index, self) => index === self.findIndex((r) => r.id === run.id)
      );

      setRuns(uniqueRuns);
      setDisplayCount(totalNeeded);
      
      // Check if we got fewer runs than requested from any club
      // If we got exactly what we asked for from all clubs, there might be more
      // We'll assume there are more unless we get significantly fewer runs
      const totalFetched = uniqueRuns.length;
      // If we got less than 80% of what we requested, likely no more runs
      const expectedMin = totalNeeded * 0.8;
      setHasMoreRuns(totalFetched >= expectedMin);

      // Update increment for next load: 20 -> 40 -> 80
      if (loadMoreIncrement === 20) {
        setLoadMoreIncrement(40);
      } else if (loadMoreIncrement === 40) {
        setLoadMoreIncrement(80);
      }
    } catch (error) {
      console.error("Error loading more runs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative rounded-lg bg-white/70 backdrop-blur-md dark:bg-zinc-900/70 p-4 md:p-6 shadow-lg">
      <div className="space-y-3">
        {displayedRuns.map((run) => (
          <div
            key={run.id}
            className="flex items-center justify-between gap-4 p-3 rounded-md bg-white/50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 truncate">
                  {run.memberName || run.runnerName || "Unknown Runner"}
                </span>
                {run.memberRole === "admin" && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    Admin
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {(() => {
                  const createdAtDate = new Date(run.createdAt);
                  const today = new Date();
                  const isToday =
                    createdAtDate.getFullYear() === today.getFullYear() &&
                    createdAtDate.getMonth() === today.getMonth() &&
                    createdAtDate.getDate() === today.getDate();

                  return (
                    <>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {isToday
                          ? formatTime(run.createdAt)
                          : `${formatDate(run.createdAt)} ${formatTime(run.createdAt)}`}
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">
                        {run.distanceKm} km
                      </span>
                      <span className="text-zinc-400 dark:text-zinc-500">
                        {formatDate(run.runDate)}
                      </span>
                    </>
                  );
                })()}
              </div>
              {run.notes && (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {run.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button
            onClick={handleLoadMore}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="text-sm"
          >
            {isLoading ? t("loading") : t("loadMore", { count: loadMoreIncrement })}
          </Button>
        </div>
      )}
    </div>
  );
}

