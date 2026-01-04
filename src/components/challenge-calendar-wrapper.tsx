"use client";

import type { Variant } from "@/lib/variant-utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Confetti from "react-confetti";
import Markdown from "react-markdown";
import { CalendarView } from "./calendar-view";
import { useChallengeProgress } from "./challenge-progress-context";
import { useChallengeState } from "./challenge-state-context";

type CalendarDay = {
  dayDate: string;
  dayNumber: number;
  plannedDistanceKm: number;
  actualDistanceKm: number | null;
  timeMinutes: number | null;
  notes: string | null;
  status: "planned" | "completed" | "skipped";
  isToday: boolean;
};

type ChallengeCalendarWrapperProps = {
  days: CalendarDay[];
  instanceId: string;
  themeKey: string;
  variant: Variant;
  initialTotalCompletedKm: number;
  targetKm: number;
  initialRemainingDistances: number[];
  todaySuggestedDistance: number | null;
  hasBackgroundImage: boolean;
  welcomeText?: string;
};

import { useTranslations } from "next-intl";

export function ChallengeCalendarWrapper({
  days: initialDays,
  instanceId,
  themeKey,
  variant,
  initialTotalCompletedKm,
  targetKm,
  initialRemainingDistances,
  welcomeText,
}: ChallengeCalendarWrapperProps) {
  const { setRemainingDistances } = useChallengeState();
  const { setTotalCompletedKm } = useChallengeProgress();
  const [days, setDays] = useState(initialDays);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showAllDoorsConfetti, setShowAllDoorsConfetti] = useState(false);
  const hasShownConfettiRef = useRef(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("club");

  useEffect(() => {
    if (searchParams.get("new") === "true" && welcomeText) {
      setTimeout(() => setShowWelcomeModal(true), 0);
      // Remove the 'new' param without refreshing the page
      const params = new URLSearchParams(searchParams.toString());
      params.delete("new");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, welcomeText, router, pathname]);

  // Reset confetti ref on mount (fresh page load)
  useEffect(() => {
    hasShownConfettiRef.current = false;
  }, []);

  // Check if all 24 doors are opened and show confetti celebration
  useEffect(() => {
    const isChristmasCalendar = days.length === 24;
    if (!isChristmasCalendar) return;

    const allDoorsOpened = days.every((day) => day.status === "completed");

    // Show confetti when all doors are opened (on page load or when completing the last door)
    if (allDoorsOpened && !hasShownConfettiRef.current) {
      hasShownConfettiRef.current = true;

      // Defer state update to avoid cascading renders
      const showTimeoutId = setTimeout(() => {
        setShowAllDoorsConfetti(true);
      }, 0);

      // Hide confetti after animation completes (5 seconds)
      const hideTimeoutId = setTimeout(() => {
        setShowAllDoorsConfetti(false);
      }, 5000);

      return () => {
        clearTimeout(showTimeoutId);
        clearTimeout(hideTimeoutId);
      };
    }

    // Reset the ref if doors are no longer all opened (edge case)
    if (!allDoorsOpened && hasShownConfettiRef.current) {
      hasShownConfettiRef.current = false;
    }
  }, [days]);

  const pendingRunRef = useRef<{
    dayDate: string;
    status: "planned" | "completed" | "skipped";
    distanceKm: number | null;
  } | null>(null);

  const handleRunSuccess = useCallback(
    (runData: {
      dayDate: string;
      distanceKm: number;
      timeMinutes?: number;
      notes?: string;
      status: "planned" | "completed" | "skipped";
    }) => {
      // Normalize date to date-only format for comparison
      const normalizeDate = (date: string) => date.split("T")[0];
      const targetDate = normalizeDate(runData.dayDate);

      // Track pending run for sync validation (support both adding and removing)
      pendingRunRef.current = {
        dayDate: targetDate,
        status: runData.status,
        distanceKm: runData.status === "planned" ? null : runData.distanceKm,
      };

      // Get previous day state before updating (use normalized date comparison)
      const previousDay = days.find((d) => normalizeDate(d.dayDate) === targetDate);
      const previousStatus = previousDay?.status;
      const previousDistanceKm = previousDay?.actualDistanceKm ?? 0;
      const plannedDistanceKm = previousDay?.plannedDistanceKm ?? 0;

      // Calculate contributions for total progress (capped at planned distance)
      const prevContribution =
        previousStatus === "completed" ? Math.min(previousDistanceKm, plannedDistanceKm) : 0;

      const newContribution =
        runData.status === "completed" ? Math.min(runData.distanceKm, plannedDistanceKm) : 0;

      // Update total completed km
      if (prevContribution !== newContribution) {
        setTotalCompletedKm((prev) => prev - prevContribution + newContribution);
      }

      // Optimistically update the UI
      setDays((prevDays) =>
        prevDays.map((day) =>
          normalizeDate(day.dayDate) === targetDate
            ? {
                ...day,
                actualDistanceKm: runData.status === "planned" ? null : runData.distanceKm,
                timeMinutes: runData.status === "planned" ? null : (runData.timeMinutes ?? null),
                notes: runData.status === "planned" ? null : (runData.notes ?? null),
                status: runData.status,
              }
            : day
        )
      );

      // Handle deletion: if status becomes "planned" and was previously "completed"
      if (runData.status === "planned" && previousStatus === "completed") {
        // Add back to remaining distances (for all variants)
        setRemainingDistances((prev) => {
          const updated = [...prev, previousDistanceKm];
          return updated.sort((a, b) => a - b);
        });
      }

      // Update total completed km if status is "completed"
      if (runData.status === "completed") {
        // Update remaining distances (for all variants)
        setRemainingDistances((prev) => {
          const updated = [...prev];
          const index = updated.indexOf(runData.distanceKm);
          if (index > -1) {
            updated.splice(index, 1);
          }
          return updated.sort((a, b) => a - b);
        });
      }

      // Refresh server components to sync with server state
      // router.refresh();
    },
    [setTotalCompletedKm, setRemainingDistances, days]
  );

  // Sync with server state when props change (after router.refresh())
  // Only sync if server data includes our pending run OR if server has more completed runs
  useEffect(() => {
    // Normalize date to date-only format for comparison
    const normalizeDate = (date: string) => date.split("T")[0];

    const currentCompletedCount = days.filter((d) => d.status === "completed").length;
    const serverCompletedCount = initialDays.filter((d) => d.status === "completed").length;

    // Check if server data matches our pending expectation (use normalized date comparison)
    const isPendingConfirmed = pendingRunRef.current
      ? initialDays.some((d) => {
          const pendingDayDate = pendingRunRef.current?.dayDate;
          if (!pendingDayDate) return false;
          return (
            normalizeDate(d.dayDate) === normalizeDate(pendingDayDate) &&
            d.status === pendingRunRef.current?.status &&
            (d.status === "planned" || d.actualDistanceKm === pendingRunRef.current?.distanceKm)
          );
        })
      : null; // No pending run tracked

    // Sync if:
    // 1. No pending run tracked AND we're on initial mount (days match initialDays exactly) - always sync
    // 2. Server has confirmed our pending run (state matches expectation)
    // 3. No pending run tracked AND server has different completed count (external update)
    const isInitialMount = JSON.stringify(days) === JSON.stringify(initialDays);
    const shouldSync =
      (isPendingConfirmed === null && isInitialMount) || // Initial load, no pending run
      isPendingConfirmed === true || // Server confirmed our pending run
      (isPendingConfirmed === null && serverCompletedCount !== currentCompletedCount); // External update (only if no pending run)

    if (shouldSync) {
      // Server has our run or has better data, safe to sync everything
      // Use setTimeout to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        setDays(initialDays);
        setTotalCompletedKm(initialTotalCompletedKm);
        setRemainingDistances(initialRemainingDistances);
        // Always clear pending run if we sync - either it was confirmed, or we're accepting server state
        pendingRunRef.current = null;
      }, 0);

      return () => clearTimeout(timeoutId);
    }
    // If server doesn't have our run yet (isPendingConfirmed === false), keep optimistic state
  }, [
    initialDays,
    initialTotalCompletedKm,
    initialRemainingDistances,
    setRemainingDistances,
    setTotalCompletedKm,
    days,
  ]);

  return (
    <>
      {/* Confetti celebration when all 24 doors are opened */}
      {showAllDoorsConfetti && typeof window !== "undefined" && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={500}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            pointerEvents: "none",
            zIndex: 50,
          }}
        />
      )}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
            <Confetti
              width={window.innerWidth}
              height={window.innerHeight}
              recycle={false}
              numberOfPieces={200}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                pointerEvents: "none",
                zIndex: 60,
              }}
            />
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {t("welcome")}
              </h2>
            </div>
            <div className="prose prose-sm dark:prose-invert max-h-[60vh] overflow-y-auto mb-6">
              <Markdown>{welcomeText}</Markdown>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowWelcomeModal(false)}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      <CalendarView
        days={days}
        instanceId={instanceId}
        themeKey={themeKey}
        variant={variant}
        targetKm={targetKm}
        onRunSuccess={handleRunSuccess}
      />
    </>
  );
}
