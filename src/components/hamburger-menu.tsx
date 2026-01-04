"use client";

import { Link, usePathname } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SignOutButton } from "./sign-out-button";

interface HamburgerMenuProps {
  userName?: string | null;
  userEmail?: string | null;
  isAdmin?: boolean;
  userId?: string | null; // Added userId to check for club admin
}

function MenuPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    setMounted(mountedRef.current);
    return () => {
      mountedRef.current = false;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}

export function HamburgerMenu({ userName, userEmail, isAdmin, userId }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);
  const t = useTranslations("navigation");
  const tClub = useTranslations("club"); // Using club translations for "Club Admin" key if exists, or fallback
  const tCommon = useTranslations("common");

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close menu when route changes - check in a callback to avoid direct setState in effect
  useEffect(() => {
    if (prevPathnameRef.current !== pathname && isOpen) {
      // Use requestAnimationFrame to move setState out of the effect body
      requestAnimationFrame(closeMenu);
    }
    prevPathnameRef.current = pathname;
  }, [pathname, isOpen, closeMenu]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeMenu]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Check if user is club admin (hardcoded for now as per requirement)
  const TEAM_ADMIN_ID = "cf66a9bc-b000-43f8-a834-9c4ba3ac96ad";
  const isClubAdmin = userId === TEAM_ADMIN_ID;

  return (
    <>
      {/* Hamburger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-lg bg-white/80 backdrop-blur-md dark:bg-zinc-900/80"
        aria-label={isOpen ? t("closeMenu") : t("openMenu")}
        aria-expanded={isOpen}
      >
        <span
          className={`block h-0.5 w-5 rounded-full bg-zinc-800 transition-all duration-300 dark:bg-zinc-200 ${
            isOpen ? "translate-y-2 rotate-45" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-5 rounded-full bg-zinc-800 transition-all duration-300 dark:bg-zinc-200 ${
            isOpen ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block h-0.5 w-5 rounded-full bg-zinc-800 transition-all duration-300 dark:bg-zinc-200 ${
            isOpen ? "-translate-y-2 -rotate-45" : ""
          }`}
        />
      </button>

      {/* Menu rendered via portal to escape any container constraints */}
      <MenuPortal>
        {/* Overlay */}
        <div
          className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
          style={{ zIndex: 9998 }}
          onClick={closeMenu}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              closeMenu();
            }
          }}
          role="button"
          tabIndex={-1}
          aria-label="Close menu"
        />

        {/* Slide-out menu */}
        <div
          className={`fixed right-0 top-0 h-full w-80 max-w-[85vw] transform bg-white shadow-2xl transition-all duration-300 ease-out dark:bg-zinc-900 ${
            isOpen ? "visible translate-x-0" : "invisible translate-x-full"
          }`}
          style={{ zIndex: 9999 }}
        >
          <div className="flex h-full flex-col">
            {/* Close button */}
            <button
              type="button"
              onClick={closeMenu}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label={t("closeMenu")}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* User info header */}
            <div className="border-b border-zinc-200 px-6 pb-6 pt-16 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-lg font-semibold text-white">
                  {userName?.charAt(0)?.toUpperCase() || userEmail?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 overflow-hidden">
                  {userName && (
                    <div className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                      {userName}
                    </div>
                  )}
                  {userEmail && (
                    <div className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                      {userEmail}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="flex-1 overflow-y-auto px-4 py-6">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/"
                    onClick={closeMenu}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      pathname === "/" || pathname.startsWith("/challenges/")
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {t("myCalendar")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/my-log"
                    onClick={closeMenu}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      pathname === "/my-log"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                    {t("myLog")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile"
                    onClick={closeMenu}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      pathname === "/profile"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    {t("profile")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/club"
                    onClick={closeMenu}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      pathname === "/club"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {t("club")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/everybody"
                    onClick={closeMenu}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      pathname === "/everybody"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    {t("everybody")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/challenges"
                    onClick={closeMenu}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                      pathname === "/challenges"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {t("challenges")}
                  </Link>
                </li>
                {isClubAdmin && (
                  <li>
                    <Link
                      href="/club-admin"
                      onClick={closeMenu}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                        pathname === "/club-admin"
                          ? "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                      {tClub("clubAdmin")}
                    </Link>
                  </li>
                )}
                {isAdmin && (
                  <li>
                    <Link
                      href="/admin"
                      onClick={closeMenu}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                        pathname.startsWith("/admin")
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {t("admin")}
                    </Link>
                  </li>
                )}
              </ul>
            </nav>

            {/* Sign out button */}
            <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
              <SignOutButton className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                {tCommon("signOut")}
              </SignOutButton>
            </div>
          </div>
        </div>
      </MenuPortal>
    </>
  );
}
