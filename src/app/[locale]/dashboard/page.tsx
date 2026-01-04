import { getServerAuthSession } from "@/auth";
import { Link } from "@/i18n/routing";
import { listChallengeInstances } from "@/lib/challenge-instances";
import { getChallengeTemplate } from "@/lib/challenge-templates";
import { type Variant, getVariantDisplayName } from "@/lib/variant-utils";
import { getTranslations, setRequestLocale } from "next-intl/server";

function getStatusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "completed":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "archived":
      return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400";
    default:
      return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400";
  }
}

import { formatDate } from "@/lib/date-utils";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tCommon = await getTranslations("common");
  const tChallenges = await getTranslations("challenges");
  const tNames = await getTranslations("challengeNames");
  const tVariant = await getTranslations("variant");
  const session = await getServerAuthSession();

  if (!session) {
    return (
      <main className="mx-auto flex max-w-3xl flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          You need to sign in to view your dashboard.
        </p>
      </main>
    );
  }

  // Fetch user's challenge instances from Usable
  const allInstances = await listChallengeInstances({
    userId: session.user.id,
  });

  // Fetch template details for each instance and filter out any with missing templates
  const instancesWithTemplates = (
    await Promise.all(
      allInstances.map(async (instance) => {
        try {
          const template = await getChallengeTemplate(instance.templateId);
          if (!template) return null;
          return { instance, template };
        } catch {
          return null;
        }
      })
    )
  ).filter(
    (
      item
    ): item is {
      instance: (typeof allInstances)[0];
      template: NonNullable<Awaited<ReturnType<typeof getChallengeTemplate>>>;
    } => item !== null
  );

  // BRUTAL SOLUTION: Filter out December challenges entirely after Dec 31st
  const now = new Date();
  // Check if we're past December 31st (of the previous year if we're in January+)
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0 = January
  const checkYear = currentMonth < 11 ? currentYear - 1 : currentYear; // If before December, check previous year
  const december31 = new Date(checkYear, 11, 31); // Dec 31 of the relevant year

  // Hide December challenges completely after Dec 31st
  const visibleInstancesWithTemplates =
    now >= december31
      ? instancesWithTemplates.filter((item) => !item.template.themeKey.includes("december"))
      : instancesWithTemplates;

  // Group instances by status and sort by joined date (newest first)
  const sortedInstances = [...visibleInstancesWithTemplates].sort(
    (a, b) => new Date(b.instance.joinedAt).getTime() - new Date(a.instance.joinedAt).getTime()
  );

  const activeInstances = sortedInstances.filter((i) => i.instance.status === "active");
  const completedInstances = sortedInstances.filter((i) => i.instance.status === "completed");

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "active":
        return tCommon("active");
      case "completed":
        return "Completed";
      case "archived":
        return "Archived";
      default:
        return status;
    }
  };

  const getVariantLabel = (variant: string): string => {
    return tVariant.has(variant)
      ? tVariant(variant)
      : getVariantDisplayName(variant as Variant, locale);
  };

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-6 px-4 py-12">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Welcome back, {session.user.email ?? "runner"}.
          </p>
        </div>
        <Link
          href="/challenges"
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {tChallenges("browseTitle")}
        </Link>
      </div>

      {instancesWithTemplates.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            You haven&apos;t joined any challenges yet.
          </p>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
            Browse available challenges to get started.
          </p>
          <Link
            href="/challenges"
            className="mt-4 inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            {tChallenges("browseTitle")}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Active Challenges */}
          {activeInstances.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Active Challenges
              </h2>
              <div className="flex flex-col gap-3">
                {activeInstances.map(({ instance, template }) => (
                  <Link
                    key={instance.id}
                    href={`/challenges/${instance.id}`}
                    className="group rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-zinc-900 group-hover:text-emerald-600 dark:text-zinc-100 dark:group-hover:text-emerald-400">
                          {tNames.has(`${template.themeKey}_${instance.variant}`)
                            ? tNames(`${template.themeKey}_${instance.variant}`)
                            : tNames.has(template.themeKey)
                              ? tNames(template.themeKey)
                              : template.name}
                        </h3>
                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                          {getVariantLabel(instance.variant)} {tChallenges("variant")} • Joined{" "}
                          {formatDate(instance.joinedAt)}
                        </p>
                        {(() => {
                          const targetKm =
                            instance.variant === "full"
                              ? template.fullDistanceTotalKm
                              : template.halfDistanceTotalKm;
                          const completedKm = instance.totalCompletedKm ?? 0;
                          const percentage = Math.round((completedKm / targetKm) * 100);
                          return (
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                              {percentage}% complete ({completedKm} / {targetKm} {tCommon("km")})
                            </p>
                          );
                        })()}
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(instance.status)}`}
                      >
                        {getStatusLabel(instance.status)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Completed Challenges */}
          {completedInstances.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Completed Challenges
              </h2>
              <div className="flex flex-col gap-3">
                {completedInstances.map(({ instance, template }) => (
                  <Link
                    key={instance.id}
                    href={`/challenges/${instance.id}`}
                    className="group rounded-lg border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-zinc-900 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
                          {tNames.has(`${template.themeKey}_${instance.variant}`)
                            ? tNames(`${template.themeKey}_${instance.variant}`)
                            : tNames.has(template.themeKey)
                              ? tNames(template.themeKey)
                              : template.name}
                        </h3>
                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                          {getVariantLabel(instance.variant)} {tChallenges("variant")} • {(() => {
                            const targetKm =
                              instance.variant === "full"
                                ? template.fullDistanceTotalKm
                                : template.halfDistanceTotalKm;
                            const completedKm = instance.totalCompletedKm ?? 0;
                            const percentage = Math.round((completedKm / targetKm) * 100);
                            return `${percentage}% complete (${completedKm} / ${targetKm} ${tCommon("km")})`;
                          })()}
                          {instance.succeeded !== null &&
                            ` • ${instance.succeeded ? "✓ Succeeded" : "✗ Failed"}`}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(instance.status)}`}
                      >
                        {getStatusLabel(instance.status)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
