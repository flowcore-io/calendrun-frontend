import { getServerAuthSession } from "@/auth";
import { ChallengeBackground } from "@/components/challenge-background";
import { CalendarPreview } from "@/components/calendar-preview";
import { SignInButton } from "@/components/sign-in-button";
import { redirect } from "@/i18n/routing";
import { listChallengeInstances } from "@/lib/challenge-instances";
import { getCurrentMonthChallenge } from "@/lib/challenge-templates";
import { resolveTheme, themes } from "@/theme/themes";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { NewUserOnboardingClient } from "./new-user-onboarding-client";

// Force dynamic rendering to prevent PWA caching issues
export const dynamic = "force-dynamic";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const tCommon = await getTranslations("common");
  const session = await getServerAuthSession();

  // If not logged in, show landing page
  if (!session) {
    return (
      <>
        <ChallengeBackground
          backgroundImageDesktop={themes.january_winter.backgroundImageDesktop}
          backgroundImageMobile={themes.january_winter.backgroundImageMobile}
        />
        <div className="relative z-10 flex flex-1 flex-col">
          <section className="mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center gap-10 px-4 py-16">
            <div className="max-w-xl space-y-4 text-center">
              <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-md sm:text-4xl">
                {t("heroTitle")}
              </h1>
              <p className="text-sm leading-relaxed text-zinc-100 drop-shadow-sm">
                {t("heroDescription")}
              </p>
            </div>
            <div className="w-full max-w-sm text-sm">
              <div className="rounded-xl border border-zinc-200 bg-white/80 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80 backdrop-blur-sm">
                <p className="mb-4 text-xs text-zinc-600 dark:text-zinc-400">
                  {t("forRunnersDesc")}
                </p>
                <SignInButton className="w-full">{tCommon("signIn")}</SignInButton>
              </div>
            </div>
          </section>
        </div>
      </>
    );
  }

  // User is logged in - check if they have an active challenge
  const instances = await listChallengeInstances({
    userId: session.user.id,
    status: "active",
  });

  // If user has an active challenge, redirect to it
  if (instances.length > 0) {
    const now = new Date();
    // Check if we're past December 31st (of the previous year if we're in January+)
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0 = January
    const checkYear = currentMonth < 11 ? currentYear - 1 : currentYear; // If before December, check previous year
    const december31 = new Date(checkYear, 11, 31); // Dec 31 of the relevant year

    // BRUTAL SOLUTION: Never redirect to December challenges after Dec 31st
    let availableInstances = instances;

    if (now >= december31) {
      // Filter out December challenges entirely
      availableInstances = instances.filter((inst) => !inst.themeKey.includes("december"));

      // If no non-December challenges available, redirect to challenges browse page
      if (availableInstances.length === 0) {
        redirect({ href: "/challenges", locale });
      }
    }

    // Redirect to the most recently joined active challenge
    const sortedInstances = [...availableInstances].sort(
      (a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime()
    );
    redirect({ href: `/challenges/${sortedInstances[0]?.id}`, locale });
  }

  // User has no active challenge - show onboarding with current month's calendar
  const currentChallenge = await getCurrentMonthChallenge();

  if (!currentChallenge) {
    // No current month challenge - redirect to challenges browse page
    redirect({ href: "/challenges", locale });
    return; // TypeScript needs this for type narrowing
  }

  // Show onboarding page with calendar preview and modal
  const { tokens } = resolveTheme(currentChallenge.themeKey);

  return (
    <>
      <ChallengeBackground
        backgroundImageDesktop={tokens.backgroundImageDesktop}
        backgroundImageMobile={tokens.backgroundImageMobile}
      />
      <div className="relative z-10 flex flex-1 flex-col">
        <div className="mx-auto flex max-w-5xl flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
          {/* Calendar preview in background */}
          <div className="w-full max-w-3xl">
            <CalendarPreview template={currentChallenge} />
          </div>
        </div>
      </div>
      {/* Onboarding modal */}
      <NewUserOnboardingClient template={currentChallenge} themeTokens={tokens} locale={locale} />
    </>
  );
}
