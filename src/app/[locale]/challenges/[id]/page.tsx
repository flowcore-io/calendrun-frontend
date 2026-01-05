import { getServerAuthSession } from "@/auth";
import { ChallengeBackground } from "@/components/challenge-background";
import { ChallengeCalendarWrapper } from "@/components/challenge-calendar-wrapper";
import { ChallengeProgress } from "@/components/challenge-progress";
import { ChallengeProgressProvider } from "@/components/challenge-progress-context";
import { ChallengeStateProvider } from "@/components/challenge-state-context";
import { ClubRecentRuns } from "@/components/club-recent-runs";
import { JanuaryPromotionWrapper } from "@/components/january-promotion-wrapper";
import { PWARedirectHandler } from "@/components/pwa-redirect-handler";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { getChallengeInstance, listChallengeInstances } from "@/lib/challenge-instances";
import { getChallengeTemplate, listChallengeTemplates } from "@/lib/challenge-templates";
import { getUserClubs, type LocalizedString } from "@/lib/club-service";
import { getClubRuns, listRunPerformances, type ClubRunPerformance } from "@/lib/run-performances";
import { getVariantDisplayName, variantToMultiplier } from "@/lib/variant-utils";
import { resolveTheme } from "@/theme/themes";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";

// Force dynamic rendering to prevent PWA caching issues
export const dynamic = "force-dynamic";

export default async function ChallengeCalendarPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  setRequestLocale(locale);

  // Force dynamic rendering to prevent PWA caching issues
  // This ensures the redirect logic always runs fresh

  const t = await getTranslations("challenges");
  const tNames = await getTranslations("challengeNames");
  const tCommon = await getTranslations("common");
  const tProfile = await getTranslations("profile");
  const tCalendar = await getTranslations("calendar");
  const tNav = await getTranslations("navigation");
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/api/auth/signin/keycloak");
  }

  // Fetch instance from Usable
  const instance = await getChallengeInstance(id);

  if (!instance || instance.userId !== session.user.id) {
    console.error("[Challenge Page] Instance not found or unauthorized:", {
      instanceFound: !!instance,
      instanceUserId: instance?.userId,
      sessionUserId: session.user.id,
    });
    notFound();
  }

  // Fetch template from Usable
  const template = await getChallengeTemplate(instance.templateId);

  if (!template) {
    console.error("[Challenge Page] Template not found:", {
      templateId: instance.templateId,
    });
    notFound();
  }

  // Fetch all run performances for this instance
  const runs = await listRunPerformances({ instanceId: id });

  // Generate all days in range
  const startDate = new Date(template.startDate);
  const endDate = new Date(template.endDate);
  const allDays: Array<{
    dayDate: string;
    dayNumber: number;
    plannedDistanceKm: number;
    actualDistanceKm: number | null;
    timeMinutes: number | null;
    notes: string | null;
    status: "planned" | "completed" | "skipped";
    isToday: boolean;
  }> = [];

  // Create a map of runs by date for quick lookup
  const runsMap = new Map(runs.map((run) => [run.runDate, run]));

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0] ?? "";

  const variantMultiplier = variantToMultiplier(instance.variant);

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split("T")[0] ?? "";
    const dayIndex = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const baseDistance = template.requiredDistancesKm[dayIndex] ?? 0;
    const plannedDistanceKm = baseDistance * variantMultiplier;

    const existingRun = runsMap.get(dateStr);
    allDays.push({
      dayDate: dateStr,
      dayNumber: dayIndex + 1,
      plannedDistanceKm,
      actualDistanceKm: existingRun?.distanceKm ?? null,
      timeMinutes: existingRun?.timeMinutes ?? null,
      notes: existingRun?.notes ?? null,
      status: (existingRun?.status === "deleted" ? "planned" : existingRun?.status) ?? "planned",
      isToday: dateStr === todayStr,
    });
  }

  // Calculate progress
  const totalCompletedKm = allDays.reduce((sum, day) => {
    if (day.status === "completed" && day.actualDistanceKm !== null) {
      return sum + Math.min(day.actualDistanceKm, day.plannedDistanceKm);
    }
    return sum;
  }, 0);
  // Calculate target distance based on variant multiplier
  const targetKm = template.fullDistanceTotalKm * variantMultiplier;

  // Get all completed distances from runs for remaining distances logic
  const completedRuns = runs.filter((r) => r.status === "completed");

  // Calculate remaining distance pool for both full and half calendars
  const remainingDistances: number[] = [];
  let todaySuggestedDistance: number | null = null;

  // Get all completed distances
  const completedDistances = completedRuns.map((r) => r.distanceKm);

  // Calculate remaining distances from the original pool
  // Scale distances by variant multiplier
  const originalPool = new Map<number, number>();
  for (const distance of template.requiredDistancesKm) {
    const scaledDistance = distance * variantMultiplier;
    originalPool.set(scaledDistance, (originalPool.get(scaledDistance) ?? 0) + 1);
  }

  // Subtract completed distances from the pool
  // A completed distance consumes the matching door if logged >= required
  for (const completedDistance of completedDistances) {
    // Find a pool entry where the completed distance satisfies the requirement (>= required)
    const sortedPoolEntries = Array.from(originalPool.entries())
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[0] - a[0]); // Sort descending to match largest satisfiable distance first

    for (const [requiredDistance, count] of sortedPoolEntries) {
      if (completedDistance >= requiredDistance && count > 0) {
        originalPool.set(requiredDistance, count - 1);
        break; // Each completed run consumes only one door
      }
    }
  }

  // Build remaining distances array
  for (const [distance, count] of originalPool.entries()) {
    for (let i = 0; i < count; i++) {
      remainingDistances.push(distance);
    }
  }
  remainingDistances.sort((a, b) => a - b);

  // Find today's suggested distance
  const todayDay = allDays.find((d) => d.dayDate === todayStr);
  if (todayDay && todayDay.status === "planned") {
    todaySuggestedDistance = todayDay.plannedDistanceKm;
  }

  // Simplified challenge name logic - prefer theme name to keep it short (e.g. "December Calendar")
  const challengeName = tNames.has(template.themeKey) ? tNames(template.themeKey) : template.name;

  const { tokens } = resolveTheme(instance.themeKey);
  const hasBackgroundImage = Boolean(tokens.backgroundImageDesktop || tokens.backgroundImageMobile);

  const variantLabel = getVariantDisplayName(instance.variant, locale);

  // Fetch user clubs to display in header
  const userClubs = await getUserClubs(session.user.id);
  const clubLabel =
    userClubs.length === 1
      ? userClubs[0].name
      : userClubs.length > 1
        ? tProfile("clubs")
        : tCommon("viewClub");

  // Check if user is a member of Bragdið club (for training plan access)
  const isBragdidMember = userClubs.some(club =>
    club.name.toLowerCase().includes('bragdið') ||
    club.name.toLowerCase().includes('bragd')
  );

  // Fetch recent runs from all clubs the user is a member of
  let recentClubRuns: ClubRunPerformance[] = [];
  if (userClubs.length > 0) {
    try {
      // Fetch runs from all clubs in parallel
      // Fetch enough runs per club to ensure we capture the 10 most recent by created_at
      // Since API orders by run_date first, then created_at, we fetch 20 per club to be safe
      const allClubRuns = await Promise.all(
        userClubs.map((club) => getClubRuns(club.id, { limit: 20, status: "completed" }))
      );

      // Combine all runs and sort by created_at descending
      const combinedRuns = allClubRuns.flat();
      
      // Debug: Log user's runs to see if they're included
      const userRuns = combinedRuns.filter((run) => run.userId === session.user.id);
      if (userRuns.length > 0) {
        console.log(`[Club Recent Runs] Found ${userRuns.length} runs for current user`);
      } else {
        console.log(`[Club Recent Runs] No runs found for current user (userId: ${session.user.id})`);
        console.log(`[Club Recent Runs] Total runs fetched: ${combinedRuns.length}`);
      }
      
      recentClubRuns = combinedRuns
        .sort((a, b) => {
          const timeA = new Date(a.createdAt).getTime();
          const timeB = new Date(b.createdAt).getTime();
          return timeB - timeA;
        });
      // Don't limit here - pass all runs to component, it will handle display limit
    } catch (error) {
      console.error("Error fetching recent club runs:", error);
      // Continue without showing recent runs if there's an error
    }
  }

  // Get welcome text - use club welcome text if available, otherwise use default
  const activeClub = userClubs[0];
  const clubWelcomeText = activeClub?.welcomeText
    ? activeClub.welcomeText[locale as keyof LocalizedString] || activeClub.welcomeText.en
    : undefined;
  const welcomeText = clubWelcomeText || tCalendar("defaultWelcome");

  // BRUTAL SOLUTION: Block December calendar access entirely after Dec 31st
  const now = new Date();
  // Check if we're past December 31st (of the previous year if we're in January+)
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0 = January
  const checkYear = currentMonth < 11 ? currentYear - 1 : currentYear; // If before December, check previous year
  const december31 = new Date(checkYear, 11, 31); // Dec 31 of the relevant year

  // If it's past Dec 31st and user is trying to access December calendar, redirect to home page immediately
  if (now >= december31 && instance.themeKey.includes("december")) {
    redirect("/");
  }

  // Check if we should show January promotion modal (only for December challenges before cutoff)
  const shouldShowPromotion = now >= december31 && instance.themeKey.includes("december");

  // Check if user has an active January challenge
  const allUserInstances = await listChallengeInstances({
    userId: session.user.id,
    status: "active",
  });
  const hasJanuaryChallenge = allUserInstances.some((inst) => inst.themeKey.includes("january"));

  // If user is viewing a December challenge after Dec 31st and has an active January challenge,
  // redirect them to the January challenge instead (fixes PWA caching issues)
  if (now >= december31 && instance.themeKey.includes("december") && hasJanuaryChallenge) {
    const januaryInstance = allUserInstances.find((inst) => inst.themeKey.includes("january"));
    if (januaryInstance) {
      redirect(`/challenges/${januaryInstance.id}`);
    }
  }

  // Find January template if it exists
  const allTemplates = await listChallengeTemplates();
  console.log(
    "[Challenge Page] All templates:",
    allTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      themeKey: t.themeKey,
      endDate: t.endDate,
    }))
  );

  const januaryTemplate = allTemplates.find(
    (t) => t.themeKey.includes("january") && new Date(t.endDate) >= now
  );
  console.log(
    "[Challenge Page] January template found:",
    januaryTemplate
      ? {
          id: januaryTemplate.id,
          name: januaryTemplate.name,
          themeKey: januaryTemplate.themeKey,
        }
      : "NONE"
  );

  const showJanuaryPromotion =
    shouldShowPromotion && !hasJanuaryChallenge && januaryTemplate !== undefined;
  console.log("[Challenge Page] Show January promotion:", showJanuaryPromotion, {
    shouldShowPromotion,
    hasJanuaryChallenge,
  });

  return (
    <>
      {/* PWA redirect handler for cached scenarios */}
      <PWARedirectHandler currentThemeKey={instance.themeKey} />

      {/* Background image - rendered via client component to ensure visibility */}
      {hasBackgroundImage && (
        <ChallengeBackground
          backgroundImageDesktop={tokens.backgroundImageDesktop}
          backgroundImageMobile={tokens.backgroundImageMobile}
        />
      )}
      <JanuaryPromotionWrapper
        currentThemeKey={instance.themeKey}
        januaryTemplate={januaryTemplate ?? null}
        showPromotion={showJanuaryPromotion}
      >
        <main className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col gap-1 md:gap-6 px-4 md:px-8 py-1 md:py-4 z-10 bg-transparent">
          <ChallengeProgressProvider initialTotalCompletedKm={totalCompletedKm}>
            <ChallengeStateProvider initialRemainingDistances={remainingDistances}>
              {/* Content with backdrop blur for readability */}
              <div
                className={`relative rounded-lg ${
                  hasBackgroundImage
                    ? "bg-white/70 backdrop-blur-md dark:bg-zinc-900/70"
                    : "bg-white dark:bg-zinc-900"
                } p-2 md:p-6 shadow-lg`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
                      {challengeName}
                    </h1>
                    <div className="mt-1 flex flex-wrap items-center gap-x-1 text-xs md:text-sm text-zinc-600 dark:text-zinc-400">
                      <span>
                        {variantLabel} {t("variant")} • {template.days} {tCommon("days")}
                      </span>
                    </div>
                  </div>
                  <ChallengeProgress targetKm={targetKm} />
                </div>
              </div>
              {/* Calendar view - no background to show the beautiful background image */}
              <div className="relative rounded-lg p-0 md:p-6">
                <ChallengeCalendarWrapper
                  days={allDays}
                  instanceId={id}
                  themeKey={instance.themeKey}
                  variant={instance.variant}
                  initialTotalCompletedKm={totalCompletedKm}
                  targetKm={targetKm}
                  initialRemainingDistances={remainingDistances}
                  todaySuggestedDistance={todaySuggestedDistance}
                  hasBackgroundImage={hasBackgroundImage}
                  welcomeText={welcomeText}
                />
              </div>

              {/* Club and Training Plan Buttons - moved above recent club runs */}
              <div className="flex justify-center gap-4 pb-4 mt-4">
                <Button
                  asChild
                  size="sm"
                  className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 border-transparent shadow-md"
                >
                  <Link href="/club">{clubLabel}</Link>
                </Button>
                {isBragdidMember && (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="shadow-md"
                  >
                    <Link href="/training-plan">{tNav("trainingPlan")}</Link>
                  </Button>
                )}
              </div>

              {/* Recent Club Runs - now placed below buttons */}
              {recentClubRuns.length > 0 && (
                <div className="mt-4 md:mt-6">
                  <ClubRecentRuns
                    initialRuns={recentClubRuns}
                    clubIds={userClubs.map((club) => club.id)}
                    currentUserId={session.user.id}
                  />
                </div>
              )}
            </ChallengeStateProvider>
          </ChallengeProgressProvider>
        </main>
      </JanuaryPromotionWrapper>
    </>
  );
}
