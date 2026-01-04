"use client";

import { HamburgerMenu } from "@/components/hamburger-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Link, usePathname } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/cn";
import type { Session } from "next-auth";
import Image from "next/image";

type AppHeaderProps = {
  locale: Locale;
  session: Session | null;
};

export function AppHeader({ locale, session }: AppHeaderProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  const roles = session?.user?.roles ?? [];
  const isAdmin = roles.includes("system_admin") || roles.includes("club_admin");

  // For authenticated users, show minimal header with hamburger menu
  if (session) {
    return (
      <header className="fixed left-0 right-0 top-0 z-30 border-b border-zinc-200/50 bg-white/70 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-950/70">
        <div className="mx-auto flex w-full max-w-full items-center justify-between gap-4 px-4 md:px-8 py-2">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/calendrun.png"
              alt="CalendRun"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-sm font-semibold tracking-tight">CalendRun</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher locale={locale} />
            <HamburgerMenu
              userName={session.user.name}
              userEmail={session.user.email}
              isAdmin={isAdmin}
              userId={session.user.id}
            />
          </div>
        </div>
      </header>
    );
  }

  // For unauthenticated users
  // If on home page, make transparent and fixed to show background
  return (
    <header
      className={cn(
        "transition-colors z-30",
        isHomePage
          ? "fixed left-0 right-0 top-0 border-transparent bg-transparent"
          : "relative border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80"
      )}
    >
      <div className="mx-auto flex w-full max-w-full items-center justify-between gap-4 px-4 md:px-8 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/calendrun.png"
            alt="CalendRun"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span
            className={cn(
              "text-sm font-semibold tracking-tight",
              isHomePage ? "text-white drop-shadow-md" : ""
            )}
          >
            CalendRun
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <LanguageSwitcher locale={locale} />
        </nav>
      </div>
    </header>
  );
}
