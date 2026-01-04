"use client";

import { useTranslations } from "next-intl";

type RemainingDistancesProps = {
  remainingDistances: number[];
  todaySuggestedDistance: number | null;
  hideTitle?: boolean;
};

/**
 * Component to display remaining distances in the distance pool.
 * Shows distances as chips, highlighting today's suggested distance.
 */
export function RemainingDistances({
  remainingDistances,
  todaySuggestedDistance,
  hideTitle = false,
}: RemainingDistancesProps) {
  const t = useTranslations("calendar");
  const tCommon = useTranslations("common");

  if (remainingDistances.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
        {t("allDistancesCompleted")}
      </div>
    );
  }

  // Group distances by value for display
  const distanceGroups = new Map<number, number>();
  for (const distance of remainingDistances) {
    distanceGroups.set(distance, (distanceGroups.get(distance) ?? 0) + 1);
  }

  const sortedDistances = Array.from(distanceGroups.entries()).sort((a, b) => a[0] - b[0]);

  return (
    <div className="space-y-2">
      {!hideTitle && (
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {t("remainingDistances")}
        </h3>
      )}
      <div className="flex flex-wrap gap-2">
        {sortedDistances.map(([distance, count]) => {
          const isToday = todaySuggestedDistance === distance;
          return (
            <div
              key={distance}
              className={`flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                isToday
                  ? "border-emerald-500 bg-emerald-100 text-emerald-900 ring-2 ring-emerald-500 ring-offset-1 dark:border-emerald-400 dark:bg-emerald-900/50 dark:text-emerald-100"
                  : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              <span>
                {distance} {tCommon("km")}
              </span>
              {count > 1 && <span className="text-[10px] opacity-70">×{count}</span>}
              {isToday && (
                <span className="ml-1 text-[10px] font-semibold">({tCommon("today")})</span>
              )}
            </div>
          );
        })}
      </div>
      {todaySuggestedDistance !== null && (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          {t("todaysSuggestedDistance")}{" "}
          <span className="font-semibold">
            {todaySuggestedDistance} {tCommon("km")}
          </span>
        </p>
      )}
    </div>
  );
}
