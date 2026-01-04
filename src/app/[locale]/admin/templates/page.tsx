import { getServerAuthSession } from "@/auth";
import { Link } from "@/i18n/routing";
import { listChallengeTemplates } from "@/lib/challenge-templates";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { formatDate } from "@/lib/date-utils";

export default async function AdminTemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin");
  const tCommon = await getTranslations("common");
  const session = await getServerAuthSession();
  const roles = session?.user.roles ?? [];
  const isAdmin = roles.includes("system_admin") || roles.includes("club_admin");

  if (!session || !isAdmin) {
    return (
      <main className="mx-auto flex max-w-3xl flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("accessDenied")}</p>
      </main>
    );
  }

  // Fetch all challenge templates from Usable
  const templates = await listChallengeTemplates();

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("challengeTemplates")}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {t("challengeTemplatesDesc")}
        </p>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No challenge templates found.</p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
            Run: yarn env-cmd -f .env.local tsx scripts/seed-templates-usable.ts
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {templates.map((template) => {
            const distancesPreview =
              template.requiredDistancesKm.length > 5
                ? `${template.requiredDistancesKm.slice(0, 5).join(", ")}, ... (+${template.requiredDistancesKm.length - 5} more)`
                : template.requiredDistancesKm.join(", ");

            return (
              <Link
                key={template.id}
                href={`/admin/templates/${template.id}`}
                className="group rounded-lg border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-zinc-900 group-hover:text-emerald-600 dark:text-zinc-100 dark:group-hover:text-emerald-400">
                      {template.name}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {template.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500 dark:text-zinc-500">
                      <span>
                        {formatDate(template.startDate)} - {formatDate(template.endDate)}
                      </span>
                      <span>•</span>
                      <span>
                        {template.days} {tCommon("days")}
                      </span>
                      <span>•</span>
                      <span>Theme: {template.themeKey}</span>
                    </div>
                    <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                      <span className="font-medium">Distances:</span> {distancesPreview}{" "}
                      {tCommon("km")}
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-zinc-500 dark:text-zinc-500">
                      <span>
                        Full: {template.fullDistanceTotalKm} {tCommon("km")} total
                      </span>
                      <span>
                        Half: {template.halfDistanceTotalKm} {tCommon("km")} total
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
