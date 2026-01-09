"use client";

import type { ChallengeTemplate } from "@/lib/challenge-templates";
import type { Variant } from "@/lib/variant-utils";
import { variantToMultiplier } from "@/lib/variant-utils";
import { resolveTheme } from "@/theme/themes";

type CalendarPreviewProps = {
  template: ChallengeTemplate;
  variant?: Variant;
};

export function CalendarPreview({ template, variant = "full" }: CalendarPreviewProps) {
  const { tokens } = resolveTheme(template.themeKey);
  const variantMultiplier = variantToMultiplier(variant);

  // Generate preview days (all in "planned" state)
  const startDate = new Date(template.startDate);
  const endDate = new Date(template.endDate);
  const days: Array<{
    dayDate: string;
    dayNumber: number;
    plannedDistanceKm: number;
    status: "planned";
  }> = [];

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split("T")[0] ?? "";
    const dayIndex = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const baseDistance = template.requiredDistancesKm[dayIndex] ?? 0;
    const plannedDistanceKm = baseDistance * variantMultiplier;

    days.push({
      dayDate: dateStr,
      dayNumber: dayIndex + 1,
      plannedDistanceKm,
      status: "planned",
    });
  }

  const isChristmasCalendar = days.length === 24;
  const isJanuaryCalendar = days.length === 31;

  // Calculate weekday offset for monthly calendars
  const firstDayDate = days.length > 0 ? new Date(days[0]?.dayDate) : null;
  const weekdayOffset = firstDayDate ? (firstDayDate.getDay() + 6) % 7 : 0;

  if (isChristmasCalendar) {
    return (
      <div className="space-y-4 opacity-60">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3">
          {days.map((day) => {
            // Planned: semi-transparent gold
            const backgroundColor = "rgba(247, 201, 72, 0.25)"; // tokens.accentSoft with 25% opacity

            return (
              <div
                key={day.dayDate}
                className="flex aspect-[6/5] flex-col items-center justify-center rounded-lg border text-sm md:text-base lg:text-lg font-semibold backdrop-blur-sm pointer-events-none"
                style={{
                  backgroundColor,
                  borderColor: `${tokens.border}80`,
                  color: tokens.foreground,
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
                }}
              >
                <span className="font-bold text-base md:text-xl lg:text-2xl">{day.dayNumber}</span>
                <span className="text-xs md:text-sm opacity-80">{day.plannedDistanceKm} km</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Generic monthly calendar (for 31-day January calendar or other month-long challenges)
  return (
    <div className="space-y-1 sm:space-y-4 opacity-60">
      <div
        className={`grid gap-0.5 text-xs sm:gap-2 ${
          isJanuaryCalendar ? "grid-cols-7" : "grid-cols-4 sm:grid-cols-7"
        }`}
      >
        {/* Empty cells for weekday alignment */}
        {Array.from({ length: weekdayOffset }, (_, index) => {
          const cellId = `empty-cell-${weekdayOffset}-${index}`;
          return (
            <div
              key={cellId}
              className={isJanuaryCalendar ? "block" : "hidden sm:block"}
            />
          );
        })}
        {/* Calendar days */}
        {days.map((day) => (
          <div
            key={day.dayDate}
            className={`flex flex-col items-center justify-center rounded-sm sm:rounded-md border shadow-none sm:shadow-sm relative p-0 sm:p-1 pointer-events-none ${
              isJanuaryCalendar
                ? "aspect-[0.85] sm:aspect-square"
                : "aspect-square"
            }`}
            style={{
              backgroundColor: tokens.accentSoft,
              borderColor: tokens.border,
              borderWidth: "1px",
              color: "#000000", // Black text for unopened doors
            }}
          >
            <span className="text-[10px] sm:text-sm font-medium leading-none">{day.dayNumber}</span>
            <span className="text-[8px] sm:text-[10px] text-black opacity-70 leading-none mt-0.5">
              {day.plannedDistanceKm} km
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
