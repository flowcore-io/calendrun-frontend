import { getServerAuthSession } from "@/auth";
import { ChallengeBackground } from "@/components/challenge-background";
import { redirect } from "@/i18n/routing";
import { getCurrentMonthChallenge } from "@/lib/challenge-templates";
import { listRunPerformances } from "@/lib/run-performances";
import { backendClient } from "@/lib/backend-client";
import { themes } from "@/theme/themes";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { formatDate, formatTime } from "@/lib/date-utils";

export default async function RunnerActivityPage({
  params,
}: {
  params: Promise<{ userId: string; locale: string }>;
}) {
  const { userId, locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("everybody");
  const tCommon = await getTranslations("common");
  const tRunLog = await getTranslations("runLog");
  const session = await getServerAuthSession();

  if (!session) {
    redirect({ href: "/api/auth/signin/keycloak", locale });
    return null;
  }

  // Get current month's challenge to determine date range
  const currentChallenge = await getCurrentMonthChallenge();
  if (!currentChallenge) {
    return (
      <>
        <ChallengeBackground
          backgroundImageDesktop={themes.january_winter.backgroundImageDesktop}
          backgroundImageMobile={themes.january_winter.backgroundImageMobile}
        />
        <main className="relative z-10 mx-auto max-w-4xl px-5 sm:px-6 py-8">
          <div className="rounded-lg border border-zinc-200/20 bg-white/90 shadow-lg backdrop-blur-sm dark:border-zinc-700/30 dark:bg-zinc-900/90 p-6">
            <p className="text-zinc-600 dark:text-zinc-400">
              {t("noActiveChallenge")}
            </p>
          </div>
        </main>
      </>
    );
  }

  // Get user information
  let userName: string | null = null;
  try {
    const users = await backendClient.get<
      Array<{ id: string; name: string | null; email: string | null }>
    >("/api/users", {
      userIds: userId,
    });
    if (users && users.length > 0) {
      userName = users[0]?.name || null;
    }
  } catch (error) {
    console.error("Error fetching user:", error);
  }

  // Get all runs for this user
  const allRuns = await listRunPerformances({ userId });

  // Filter runs to current month
  const challengeStartDate = new Date(currentChallenge.startDate);
  const challengeEndDate = new Date(currentChallenge.endDate);
  const currentMonthRuns = allRuns.filter((run) => {
    const runDate = new Date(run.runDate);
    return (
      run.status === "completed" &&
      runDate >= challengeStartDate &&
      runDate <= challengeEndDate
    );
  });

  // Sort runs by createdAt (newest first)
  currentMonthRuns.sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });

  // Calculate door numbers for each run
  const msPerDay = 1000 * 60 * 60 * 24;
  const runsWithDoorNumbers = currentMonthRuns.map((run) => {
    const runDateObj = new Date(run.runDate);
    const dayIndex = Math.floor(
      (runDateObj.getTime() - challengeStartDate.getTime()) / msPerDay
    );
    const doorNumber = dayIndex >= 0 ? dayIndex + 1 : null;
    return { ...run, doorNumber };
  });

  // Calculate totals
  const totalDistance = currentMonthRuns.reduce(
    (sum, run) => sum + (Number(run.distanceKm) || 0),
    0
  );
  const totalRuns = currentMonthRuns.length;
  const uniqueDays = new Set(currentMonthRuns.map((run) => run.runDate)).size;

  const displayName = userName || userId.substring(0, 8) + "...";

  return (
    <>
      <ChallengeBackground
        backgroundImageDesktop={themes.january_winter.backgroundImageDesktop}
        backgroundImageMobile={themes.january_winter.backgroundImageMobile}
      />
      <main className="relative z-10 mx-auto max-w-4xl px-5 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
            {displayName} - {t("activity")}
          </h1>
          <p className="mt-2 text-zinc-200 drop-shadow-sm">
            {t("activityDescription", { month: currentChallenge.name })}
          </p>
        </div>

        <div className="space-y-6">
          {/* Runs List */}
          <div className="rounded-lg border border-zinc-200/20 bg-white/90 shadow-lg backdrop-blur-sm dark:border-zinc-700/30 dark:bg-zinc-900/90 overflow-hidden">
            {currentMonthRuns.length === 0 ? (
              <div className="p-6 text-center text-zinc-600 dark:text-zinc-400">
                {t("noRunsThisMonth")}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-0 divide-y divide-zinc-200/50 dark:divide-zinc-700/50">
                    <thead className="bg-zinc-50/80 dark:bg-zinc-800/60">
                      <tr>
                        <th
                          scope="col"
                          className="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-300"
                        >
                          {tRunLog("date")}
                        </th>
                        <th
                          scope="col"
                          className="px-4 sm:px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-300"
                        >
                          {t("distance")} ({tCommon("km")})
                        </th>
                        <th
                          scope="col"
                          className="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-300"
                        >
                          {tRunLog("notes")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200/50 bg-white/80 dark:divide-zinc-700/50 dark:bg-zinc-900/80">
                      {runsWithDoorNumbers.map((run) => {
                        // Format date/time as "2026-01-04 15:00" using createdAt (when run was logged)
                        const dateStr = formatDate(run.createdAt);
                        const timeStr = formatTime(run.createdAt);
                        const dateTimeStr = `${dateStr} ${timeStr}`;

                        return (
                          <tr key={run.id}>
                            <td className="whitespace-nowrap px-4 sm:px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {dateTimeStr}
                                </span>
                                {run.doorNumber !== null && (
                                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                    {t("door")} {run.doorNumber}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-4 sm:px-6 py-4 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {(Number(run.distanceKm) || 0).toFixed(1)} {tCommon("km")}
                            </td>
                            <td className="hidden sm:table-cell px-4 sm:px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                              {run.notes ? (
                                <p className="truncate max-w-md">{run.notes}</p>
                              ) : (
                                <span className="text-zinc-400 dark:text-zinc-500">
                                  {tCommon("optional")}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-zinc-100/80 dark:bg-zinc-800/80 border-t-2 border-zinc-300/50 dark:border-zinc-600/50">
                      <tr>
                        <td className="px-4 sm:px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">
                          {t("total")}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {totalDistance.toFixed(1)} {tCommon("km")}
                        </td>
                        <td className="hidden sm:table-cell px-4 sm:px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400">
                          {totalRuns} {t("runs")} • {uniqueDays} {t("days")}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                {/* Mobile summary */}
                <div className="sm:hidden px-4 py-3 bg-zinc-100/80 dark:bg-zinc-800/80 border-t border-zinc-300/50 dark:border-zinc-600/50">
                  <div className="text-xs text-zinc-600 dark:text-zinc-400">
                    {totalRuns} {t("runs")} • {uniqueDays} {t("days")}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

