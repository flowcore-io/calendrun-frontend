import { getServerAuthSession } from "@/auth";
import { ChallengeBackground } from "@/components/challenge-background";
import { TrainingPlanCalendar } from "@/components/training-plan-calendar";
import { Link, redirect } from "@/i18n/routing";
import { getUserClubs } from "@/lib/club-service";
import { themes } from "@/theme/themes";
import { getTranslations, setRequestLocale } from "next-intl/server";

// Force dynamic rendering to prevent PWA caching issues
export const dynamic = "force-dynamic";

export default async function TrainingPlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { locale } = await params;
  const { month } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("navigation");
  const tCommon = await getTranslations("common");
  const tTrainingPlan = await getTranslations("trainingPlan");
  const session = await getServerAuthSession();

  if (!session) {
    redirect({ href: "/api/auth/signin/keycloak", locale });
  }

  // Check if user is a member of Bragdið club
  const userClubs = await getUserClubs(session!.user.id);
  const bragdidClub = userClubs.find(club =>
    club.name.toLowerCase().includes('bragdið') ||
    club.name.toLowerCase().includes('bragd')
  );

  if (!bragdidClub) {
    // User is not a member of Bragdið - redirect to challenges
    redirect({ href: "/challenges", locale });
  }

  // Parse month parameter or default to current month
  const currentDate = new Date();
  const requestedMonth = month ? parseInt(month) : currentDate.getMonth() + 1; // 1-12
  const requestedYear = month ? 2026 : 2026; // Training plan is for 2026

  // Validate month is between 1-6 (January-June)
  const validMonth = Math.max(1, Math.min(6, requestedMonth));

  return (
    <>
      <ChallengeBackground
        backgroundImageDesktop={themes.january_winter.backgroundImageDesktop}
        backgroundImageMobile={themes.january_winter.backgroundImageMobile}
      />
      <div className="relative z-10 flex flex-1 flex-col">
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
          <div className="bg-white/70 backdrop-blur-md dark:bg-zinc-900/70 rounded-lg p-4 shadow-lg">
            <Link
              href="/"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {t("backToCalendar")}
            </Link>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">
              {t("trainingPlan")} - {bragdidClub!.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {tTrainingPlan("description", { clubName: bragdidClub!.name })}
            </p>
          </div>

          <TrainingPlanCalendar
            month={validMonth}
            year={requestedYear}
          />

          {/* Footer with club button */}
          <div className="flex justify-center pb-4">
            <Link href="/club">
              <button
                type="button"
                className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 px-4 py-2 rounded-md shadow-md transition-colors"
              >
                {tCommon("viewClub")}
              </button>
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
