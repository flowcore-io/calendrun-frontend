import { getServerAuthSession } from "@/auth";
import { ChallengeBackground } from "@/components/challenge-background";
import { ClubLeaderboard } from "@/components/club-leaderboard";
import { CurrentChallengeStatus } from "@/components/current-challenge-status";
import { redirect } from "@/i18n/routing";
import { type ChallengeTemplate, getCurrentMonthChallenge } from "@/lib/challenge-templates";
import {
  type LeaderboardEntry,
  getAllUsersLeaderboard,
  getClub,
  getClubLeaderboard,
  getUserClubs,
} from "@/lib/club-service";
import { themes } from "@/theme/themes";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function ClubPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("everybody");
  const session = await getServerAuthSession();

  if (!session) {
    redirect({ href: "/api/auth/signin/keycloak", locale });
    return null;
  }

  // Get club ID from query params, or use user's first club
  const clubIdParam = resolvedSearchParams.id;
  const clubId = typeof clubIdParam === "string" ? clubIdParam : null;

  let leaderboardEntries: LeaderboardEntry[] = [];
  let leaderboardError: string | null = null;
  let clubName: string | null = null;
  let currentChallenge: ChallengeTemplate | null = null;

  // Prepare leaderboard translations for client component
  const leaderboardTranslations = {
    noMembers: t("noUsers"),
    runner: t("runner"),
    doors: t("doors"),
    distance: t("distance"),
    total: t("total"),
  };

  try {
    if (clubId) {
      // Show club-specific leaderboard
      const club = await getClub(clubId);
      if (club) {
        clubName = club.name;
        leaderboardEntries = await getClubLeaderboard(clubId);
      } else {
        leaderboardError = "Club not found";
      }
    } else {
      // If no club ID specified, try to get user's first club
      const userClubs = await getUserClubs(session.user.id);
      if (userClubs.length > 0) {
        const firstClub = userClubs[0];
        clubName = firstClub.name;
        leaderboardEntries = await getClubLeaderboard(firstClub.id);
      } else {
        // User is not in any club, show all users leaderboard as fallback
        leaderboardEntries = await getAllUsersLeaderboard();
      }
    }
  } catch (err) {
    console.error("Error loading leaderboard:", err);
    leaderboardError =
      err instanceof Error
        ? err.message
        : "Failed to load leaderboard. Please try refreshing the page.";
  }

  // Get current month's challenge
  try {
    currentChallenge = await getCurrentMonthChallenge();
  } catch (err) {
    console.error("Error loading current challenge:", err);
  }

  return (
    <>
      <ChallengeBackground
        backgroundImageDesktop={themes.january_winter.backgroundImageDesktop}
        backgroundImageMobile={themes.january_winter.backgroundImageMobile}
      />
      <main className="relative z-10 mx-auto max-w-4xl px-5 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md">
            {clubName ? `${clubName} - ${t("title")}` : t("title")}
          </h1>
          <p className="mt-2 text-zinc-200 drop-shadow-sm">{t("description")}</p>
        </div>

        <div className="space-y-8">
          {/* Current Challenge Status */}
          {currentChallenge && (
            <section>
              <h2 className="text-xl font-semibold mb-4 text-white drop-shadow-md">
                {t("currentChallenge")}
              </h2>
              <CurrentChallengeStatus challenge={currentChallenge} />
            </section>
          )}

          {/* Leaderboard Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4 text-white drop-shadow-md">
              {t("leaderboardTitle")}
            </h2>
            {leaderboardError ? (
              <div className="rounded-md bg-yellow-500/20 p-4 text-yellow-100 backdrop-blur-sm border border-yellow-500/30">
                <p className="font-medium">{leaderboardError}</p>
                <p className="mt-1 text-sm opacity-90">
                  The leaderboard data could not be loaded. This may be due to a temporary network
                  issue. Please try refreshing the page.
                </p>
              </div>
            ) : (
              <ClubLeaderboard
                entries={leaderboardEntries}
                translations={leaderboardTranslations}
              />
            )}
          </section>
        </div>
      </main>
    </>
  );
}
