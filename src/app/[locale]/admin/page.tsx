import { getServerAuthSession } from "@/auth";
import { Link } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("admin");
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

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{t("description")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/templates"
          className="group rounded-lg border border-zinc-200 bg-white p-6 transition hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <h2 className="font-medium text-zinc-900 group-hover:text-emerald-600 dark:text-zinc-100 dark:group-hover:text-emerald-400">
            {t("challengeTemplates")}
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {t("challengeTemplatesDesc")}
          </p>
        </Link>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 opacity-50 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-medium text-zinc-900 dark:text-zinc-100">{t("clubBundles")}</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("clubBundlesDesc")}</p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-6 opacity-50 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-medium text-zinc-900 dark:text-zinc-100">{t("metrics")}</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{t("metricsDesc")}</p>
        </div>
      </div>
    </main>
  );
}
