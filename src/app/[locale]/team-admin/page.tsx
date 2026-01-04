import { getServerAuthSession } from "@/auth";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function TeamAdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  await getTranslations("common");
  const session = await getServerAuthSession();

  // Hardcoded team admin user ID as per request
  const TEAM_ADMIN_ID = "cf66a9bc-b000-43f8-a834-9c4ba3ac96ad";
  const isTeamAdmin = session?.user?.id === TEAM_ADMIN_ID;

  if (!session || !isTeamAdmin) {
    return (
      <main className="mx-auto flex max-w-3xl flex-1 items-center justify-center px-4 py-16">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Access Denied. This page is restricted to team admins.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-1 flex-col gap-6 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Team Admin Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Manage your team subscription and members.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium text-zinc-900 dark:text-zinc-100">Team Subscription</h2>
              <p className="text-sm text-zinc-500">Manage your team&apos;s subscription status</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
              Active
            </span>
          </div>

          <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Subscription management features coming soon.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
