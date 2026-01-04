import { getServerAuthSession } from "@/auth";
import { Link } from "@/i18n/routing";
import { getChallengeTemplate } from "@/lib/challenge-templates";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { formatDate, formatDateTime } from "@/lib/date-utils";

export default async function AdminTemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
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

  const template = await getChallengeTemplate(id);

  if (!template) {
    notFound();
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-6 px-4 py-12">
      <div>
        <Link
          href="/admin/templates"
          className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← Back to templates
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">{template.name}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Template details and configuration
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Basic Information */}
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Basic Information
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Template ID</dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{template.id}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Name</dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{template.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Description</dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {template.description}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Theme Key</dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">{template.themeKey}</dd>
            </div>
          </dl>
        </section>

        {/* Date Range */}
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Date Range
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Start Date</dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {formatDate(template.startDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">End Date</dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {formatDate(template.endDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Days</dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {template.days} {tCommon("days")}
              </dd>
            </div>
          </dl>
        </section>

        {/* Distance Configuration */}
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Distance Configuration
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Full Calendar Total
              </dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {template.fullDistanceTotalKm} {tCommon("km")}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Half Calendar Total
              </dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {template.halfDistanceTotalKm} {tCommon("km")}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Required Distances (Full Calendar)
              </dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                <div className="flex flex-wrap gap-1">
                  {template.requiredDistancesKm.map((km, idx) => (
                    <span
                      key={`distance-day-${idx}-${km}`}
                      className="rounded bg-zinc-100 px-2 py-1 text-xs dark:bg-zinc-800"
                    >
                      Day {idx + 1}: {km} {tCommon("km")}
                    </span>
                  ))}
                </div>
              </dd>
            </div>
          </dl>
        </section>

        {/* Audit Fields */}
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Audit Information
          </h2>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Created At</dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {formatDateTime(template.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Updated At</dt>
              <dd className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {formatDateTime(template.updatedAt)}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
