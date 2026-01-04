import { getServerAuthSession } from "@/auth";
import { AbandonChallenge } from "@/components/abandon-challenge";
import { ClubWelcomeInfo } from "@/components/club-welcome-info";
import { JoinClubForm } from "@/components/join-club-form";
import { LeaveClubButton } from "@/components/leave-club-button";
import { VariantSwitcher } from "@/components/variant-switcher";
import { redirect } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { listChallengeInstances } from "@/lib/challenge-instances";
import { getChallengeTemplate } from "@/lib/challenge-templates";
import { type LocalizedString, getUserClubs } from "@/lib/club-service";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { formatDate } from "@/lib/date-utils";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("profile");
  const tChallenges = await getTranslations("challenges");
  const tNames = await getTranslations("challengeNames");
  const tCommon = await getTranslations("common");
  const session = await getServerAuthSession();

  if (!session) {
    redirect({ href: "/api/auth/signin/keycloak", locale });
    return null; // TypeScript: redirect never returns but we need to satisfy the type checker
  }

  // Get user's active challenge instance
  const instances = await listChallengeInstances({
    userId: session.user.id,
    status: "active",
  });

  // Get user's clubs
  const userClubs = await getUserClubs(session.user.id);

  const activeInstance = instances[0];
  let template = null;

  if (activeInstance) {
    template = await getChallengeTemplate(activeInstance.templateId);
  }

  const challengeName =
    template && activeInstance
      ? tNames.has(`${template.themeKey}_${activeInstance.variant}`)
        ? tNames(`${template.themeKey}_${activeInstance.variant}`)
        : tNames.has(template.themeKey)
          ? tNames(template.themeKey)
          : template.name
      : "";

  // Prepare translations for client components
  const joinClubTranslations = {
    joinClub: t("joinClub"),
    inviteToken: t("inviteToken"),
    inviteTokenPlaceholder: t("inviteTokenPlaceholder"),
    cancel: tCommon("cancel"),
    join: t("join"),
    joining: t("joining"),
  };

  const leaveClubTranslations = {
    leaveClub: t("leaveClub"),
    confirmLeave: t("confirmLeave"),
    leaving: t("leaving"),
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
        {t("title")}
      </h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("description")}</p>

      {/* User Info */}
      <section className="mt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t("account")}
        </h2>
        <div className="rounded-lg border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-xl font-semibold text-white">
              {session.user.name?.charAt(0)?.toUpperCase() ||
                session.user.email?.charAt(0)?.toUpperCase() ||
                "U"}
            </div>
            <div>
              {session.user.name && (
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  {session.user.name}
                </div>
              )}
              {session.user.email && (
                <div className="text-sm text-zinc-600 dark:text-zinc-400">{session.user.email}</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Clubs Section */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t("clubs")}
          </h2>
          <JoinClubForm translations={joinClubTranslations} locale={locale} />
        </div>

        {userClubs.length > 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {userClubs.map((club) => (
                <div key={club.id} className="flex items-center justify-between p-5">
                  <div>
                    <div className="flex items-center font-medium text-zinc-900 dark:text-zinc-100">
                      {club.name}
                      {club.welcomeText && (
                        <ClubWelcomeInfo
                          text={
                            club.welcomeText[locale as keyof LocalizedString] ||
                            club.welcomeText.en ||
                            ""
                          }
                        />
                      )}
                    </div>
                    {club.description && (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        {club.description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/club?id=${club.id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                    >
                      {t("viewClub")}
                    </Link>
                    <LeaveClubButton clubId={club.id} translations={leaveClubTranslations} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-800/50">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("noClubsJoined")}</p>
          </div>
        )}
      </section>

      {/* Challenge Settings */}
      {activeInstance && template && (
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t("challengeSettings")}
          </h2>
          <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 p-5 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {challengeName}
                  </div>
                  <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {formatDate(template.startDate)} - {formatDate(template.endDate)}
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {tCommon("active")}
                </span>
              </div>
            </div>

            {/* Variant Switcher */}
            <div className="border-b border-zinc-200 p-5 dark:border-zinc-800">
              <VariantSwitcher
                instanceId={activeInstance.id}
                currentVariant={activeInstance.variant}
                fullDistanceTotalKm={template.fullDistanceTotalKm}
                days={template.days}
              />
            </div>

            {/* Abandon Challenge */}
            <div className="p-5">
              <h3 className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {t("dangerZone")}
              </h3>
              <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">{t("dangerZoneDesc")}</p>
              <AbandonChallenge instanceId={activeInstance.id} challengeName={challengeName} />
            </div>
          </div>
        </section>
      )}

      {/* No Active Challenge */}
      {!activeInstance && (
        <section className="mt-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t("challengeStatus")}
          </h2>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-800 dark:bg-zinc-800/50">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
              <svg
                className="h-6 w-6 text-zinc-500 dark:text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                role="img"
                aria-label="No active challenge"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("noActiveChallenge")}</p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              {tChallenges("chooseChallenge")}
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
