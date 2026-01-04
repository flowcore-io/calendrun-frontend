import { getServerAuthSession } from "@/auth";
import { ChallengeJoinCard } from "@/components/challenge-join-card";
import { Link, redirect } from "@/i18n/routing";
import { listChallengeTemplates } from "@/lib/challenge-templates";
import { resolveTheme } from "@/theme/themes";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function ChallengesBrowsePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("challenges");
  const tNav = await getTranslations("navigation");
  const session = await getServerAuthSession();

  if (!session) {
    redirect({ href: "/api/auth/signin/keycloak", locale });
  }

  // Fetch all available challenge templates from Usable
  const templates = await listChallengeTemplates();

  // BRUTAL SOLUTION: Filter out December challenges entirely after Dec 31st
  const now = new Date();
  // Check if we're past December 31st (of the previous year if we're in January+)
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0 = January
  const checkYear = currentMonth < 11 ? currentYear - 1 : currentYear; // If before December, check previous year
  const december31 = new Date(checkYear, 11, 31); // Dec 31 of the relevant year

  // Hide December challenges completely after Dec 31st
  const filteredTemplates =
    now >= december31
      ? templates.filter((template) => !template.themeKey.includes("december"))
      : templates;

  // Sort templates: upcoming/current first, then future
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    const aStart = new Date(a.startDate);
    const bStart = new Date(b.startDate);
    const aEnd = new Date(a.endDate);
    const bEnd = new Date(b.endDate);

    // Current/active challenges first
    const aIsActive = aStart <= now && now <= aEnd;
    const bIsActive = bStart <= now && now <= bEnd;
    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;

    // Then by start date (upcoming first)
    return aStart.getTime() - bStart.getTime();
  });

  return (
    <main className="mx-auto flex max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          {tNav("backToDashboard")}
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{t("browseTitle")}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("browseDescription")}</p>
      </div>

      {sortedTemplates.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {now >= december31
              ? "The December calendar has ended. Check back for future challenges!"
              : t("noTemplates")}
          </p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
            {now >= december31
              ? "January and future calendars will appear here."
              : t("checkBackSoon")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTemplates.map((template) => {
            const { tokens } = resolveTheme(template.themeKey);
            const startDate = new Date(template.startDate);
            const endDate = new Date(template.endDate);
            const now = new Date();
            const isActive = startDate <= now && now <= endDate;
            const isUpcoming = startDate > now;
            const isPast = endDate < now;

            return (
              <ChallengeJoinCard
                key={template.id}
                template={template}
                themeTokens={tokens}
                isActive={isActive}
                isUpcoming={isUpcoming}
                isPast={isPast}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
