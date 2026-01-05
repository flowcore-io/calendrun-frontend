"use client";

import type { LeaderboardEntry } from "@/lib/club-service";
import { useRouter } from "@/i18n/routing";

interface ClubLeaderboardProps {
  entries: LeaderboardEntry[];
  translations: {
    noMembers: string;
    runner: string;
    doors: string;
    distance: string;
    total: string;
  };
}

export function ClubLeaderboard({ entries, translations }: ClubLeaderboardProps) {
  const router = useRouter();

  if (entries.length === 0) {
    return <div className="py-12 text-center text-zinc-200">{translations.noMembers}</div>;
  }

  const handleRowClick = (userId: string) => {
    router.push(`/club/runner/${userId}`);
  };

  // Calculate totals
  const totals = entries.reduce(
    (acc, entry) => ({
      doors: acc.doors + entry.doorsOpened,
      distance: acc.distance + entry.totalDistanceKm,
      target: acc.target + entry.targetDistanceKm,
    }),
    { doors: 0, distance: 0, target: 0 }
  );

  return (
    <div className="w-full max-w-full overflow-x-auto rounded-lg border border-zinc-200/20 bg-white/90 shadow-lg backdrop-blur-sm dark:border-zinc-700/30 dark:bg-zinc-900/90">
      <table className="w-full min-w-0 table-fixed divide-y divide-zinc-200/50 dark:divide-zinc-700/50">
        <thead className="bg-zinc-50/80 dark:bg-zinc-800/60">
          <tr>
            <th
              scope="col"
              className="px-2 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-300 w-8 sm:w-12"
            >
              #
            </th>
            <th
              scope="col"
              className="px-2 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-300"
            >
              {translations.runner}
            </th>
            <th
              scope="col"
              className="hidden sm:table-cell px-3 sm:px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-300 w-16 sm:w-20"
            >
              {translations.doors}
            </th>
            <th
              scope="col"
              className="pl-2 pr-5 sm:px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-300 w-16 sm:w-36"
            >
              {translations.distance}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200/50 bg-white/80 dark:divide-zinc-700/50 dark:bg-zinc-900/80">
          {entries.map((entry, index) => (
            <tr
              key={entry.userId}
              onClick={() => handleRowClick(entry.userId)}
              className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
            >
              <td className="whitespace-nowrap px-2 sm:px-6 py-4 text-sm text-zinc-600 dark:text-zinc-300">
                {index + 1}
              </td>
              <td className="px-2 sm:px-6 py-4">
                <div className="flex items-center min-w-0">
                  <div className="h-8 w-8 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold dark:bg-indigo-900/50 dark:text-indigo-200">
                    {entry.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-3 sm:ml-4 min-w-0">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {entry.displayName}
                    </div>
                  </div>
                </div>
              </td>
              <td className="hidden sm:table-cell whitespace-nowrap px-3 sm:px-6 py-4 text-right text-sm text-zinc-600 dark:text-zinc-300">
                <div className="flex items-center justify-end gap-1.5">
                  <span>{entry.doorsOpened}</span>
                  {entry.totalDistanceKm >= entry.targetDistanceKm && (
                    <svg
                      className="h-4 w-4 text-green-600 dark:text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      role="img"
                      aria-label="Goal reached"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  )}
                </div>
              </td>
              <td className="pl-2 pr-5 sm:px-6 py-4 text-right text-sm">
                <div className="flex items-start justify-end gap-1.5 sm:items-center">
                  <div className="flex flex-col items-end sm:flex-row sm:items-center">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {typeof entry.totalDistanceKm === "number"
                        ? entry.totalDistanceKm.toFixed(1)
                        : Number.parseFloat(String(entry.totalDistanceKm || 0)).toFixed(1)}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                      {" / "}
                      {entry.targetDistanceKm} km
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400 sm:hidden text-xs block">
                      / {entry.targetDistanceKm}
                    </span>
                  </div>
                  {entry.totalDistanceKm >= entry.targetDistanceKm && (
                    <svg
                      className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400 sm:hidden mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      role="img"
                      aria-label="Goal reached"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-zinc-100/80 dark:bg-zinc-800/80 border-t-2 border-zinc-300/50 dark:border-zinc-600/50">
          <tr>
            <td className="px-2 sm:px-6 py-4" />
            <td className="px-2 sm:px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
              {translations.total}
            </td>
            <td className="hidden sm:table-cell whitespace-nowrap px-3 sm:px-6 py-4 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {totals.doors}
            </td>
            <td className="pl-2 pr-5 sm:px-6 py-4 text-right text-sm">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {totals.distance.toFixed(1)}
              </span>
              <span className="text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                {" / "}
                {totals.target} km
              </span>
              <span className="text-zinc-500 dark:text-zinc-400 sm:hidden text-xs block">
                / {totals.target}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
