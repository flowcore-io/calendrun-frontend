import { getServerAuthSession } from "@/auth";
import { RunLogList } from "@/components/run-log-list";
import { SignInButton } from "@/components/sign-in-button";
import { listRunPerformances } from "@/lib/run-performances";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function MyLogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("myLog");
  const tCommon = await getTranslations("common");
  const session = await getServerAuthSession();

  if (!session) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-6 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{t("title")}</h1>
        <p className="text-zinc-600 dark:text-zinc-400">{t("signInRequired")}</p>
        <SignInButton>{tCommon("signIn")}</SignInButton>
      </div>
    );
  }

  // Fetch all runs for the user
  const runs = await listRunPerformances({ userId: session.user.id });

  // Sort by recordedAt/createdAt descending (newest first)
  const sortedRuns = [...runs].sort((a, b) => {
    const timeA = new Date(a.recordedAt || a.createdAt).getTime();
    const timeB = new Date(b.recordedAt || b.createdAt).getTime();
    return timeB - timeA;
  });

  return (
    <div className="container mx-auto max-w-4xl px-5 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{t("title")}</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">{t("description")}</p>
      </div>

      <RunLogList runs={sortedRuns} />
    </div>
  );
}
