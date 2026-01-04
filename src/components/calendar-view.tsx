"use client";

import type { Variant } from "@/lib/variant-utils";
import { resolveTheme } from "@/theme/themes";
import { useState } from "react";
import { RunLogForm } from "./run-log-form";

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

type CalendarViewProps = {
  days: CalendarDay[];
  instanceId: string;
  themeKey: string;
  variant: Variant;
  targetKm: number;
  onRunSuccess: (runData: {
    dayDate: string;
    distanceKm: number;
    timeMinutes?: number;
    notes?: string;
    status: "planned" | "completed" | "skipped";
  }) => void;
};

export function CalendarView({ days, instanceId, themeKey, onRunSuccess }: CalendarViewProps) {
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const { tokens } = resolveTheme(themeKey);

  // Handle door click - open the modal to log a run
  const handleDoorClick = (day: CalendarDay) => {
    setSelectedDay(day);
  };

  const isChristmasCalendar = days.length === 24;
  const isJanuaryCalendar = days.length === 31;

  if (isChristmasCalendar) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3">
          {days.map((day) => {
            // Make doors transparent to show background
            const getBackgroundColor = () => {
              if (day.status === "completed") {
                // Completed: semi-transparent red with backdrop blur
                return "rgba(215, 38, 56, 0.3)"; // tokens.accent with 30% opacity
              }
              if (day.status === "skipped") {
                // Skipped: very transparent dark
                return "rgba(20, 1, 11, 0.2)"; // tokens.background with 20% opacity
              }
              // Planned: semi-transparent gold
              return "rgba(247, 201, 72, 0.25)"; // tokens.accentSoft with 25% opacity
            };

            return (
              <button
                type="button"
                key={day.dayDate}
                onClick={() => handleDoorClick(day)}
                className={`flex aspect-[6/5] flex-col items-center justify-center rounded-lg border text-sm md:text-base lg:text-lg font-semibold backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-lg relative ${
                  day.isToday ? "ring-2 ring-offset-2" : ""
                }`}
                style={{
                  backgroundColor: getBackgroundColor(),
                  borderColor: day.isToday
                    ? tokens.accent
                    : day.status === "completed"
                      ? tokens.accent
                      : `${tokens.border}80`, // Add transparency to border
                  color: tokens.foreground,
                  textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)", // Add text shadow for readability
                  ...(day.isToday &&
                    ({
                      "--tw-ring-color": tokens.accent,
                    } as React.CSSProperties)),
                }}
              >
                <span className="font-bold text-base md:text-xl lg:text-2xl">{day.dayNumber}</span>
                {day.actualDistanceKm !== null && (
                  <span className="text-xs md:text-sm font-medium">{day.actualDistanceKm} km</span>
                )}
                {day.status === "planned" && (
                  <span className="text-xs md:text-sm opacity-80">{day.plannedDistanceKm} km</span>
                )}
              </button>
            );
          })}
        </div>

        {selectedDay && (
          <RunLogForm
            day={selectedDay}
            instanceId={instanceId}
            onClose={() => setSelectedDay(null)}
            onSuccess={(runData) => {
              setSelectedDay(null);
              onRunSuccess(runData);
            }}
          />
        )}
      </div>
    );
  }

  // Generic monthly calendar (for 31-day January calendar or other month-long challenges)
  // Calculate weekday offset for desktop view (Monday-first calendar)
  const firstDayDate = days.length > 0 ? new Date(days[0]?.dayDate) : null;
  // JavaScript's getDay(): Sunday=0, Monday=1, ..., Saturday=6
  // Convert to Monday-first: Monday=0, Tuesday=1, ..., Sunday=6
  // Formula: (getDay() + 6) % 7
  const weekdayOffset = firstDayDate ? (firstDayDate.getDay() + 6) % 7 : 0;

  // Render a calendar day button
  const renderDayButton = (day: CalendarDay) => (
    <button
      type="button"
      key={day.dayDate}
      onClick={() => handleDoorClick(day)}
      className={`flex flex-col items-center justify-center rounded-sm sm:rounded-md border shadow-none sm:shadow-sm transition-all hover:shadow-md relative p-0 sm:p-1 ${
        isJanuaryCalendar 
          ? "aspect-[0.85] sm:aspect-square" // Shorter on mobile for 31-day calendars to fit all days
          : "aspect-square"
      } ${
        day.isToday ? "ring-1 sm:ring-2 ring-offset-0 sm:ring-offset-1" : ""
      } ${
        day.status === "completed"
          ? "opacity-100"
          : day.status === "skipped"
            ? "opacity-50"
            : "opacity-70"
      }`}
      style={{
        backgroundColor:
          day.status === "completed"
            ? tokens.accent
            : day.status === "skipped"
              ? tokens.background
              : tokens.accentSoft,
        borderColor: day.isToday ? tokens.accent : tokens.border,
        borderWidth: '1px',
        color:
          day.status === "completed"
            ? tokens.background
            : day.status === "planned"
              ? "#000000" // Black text for unopened doors
              : tokens.foreground,
        ...(day.isToday &&
          ({
            "--tw-ring-color": tokens.accent,
          } as React.CSSProperties)),
      }}
    >
      <span className="text-[10px] sm:text-sm font-medium leading-none">{day.dayNumber}</span>
      {day.actualDistanceKm !== null && (
        <span className="text-[8px] sm:text-[10px] leading-none mt-0.5">{day.actualDistanceKm} km</span>
      )}
      {day.status === "planned" && (
        <span className="text-[8px] sm:text-[10px] text-black opacity-70 leading-none mt-0.5">{day.plannedDistanceKm} km</span>
      )}
    </button>
  );

  return (
    <div className="space-y-1 sm:space-y-4">
      <div
        className={`grid gap-0.5 text-xs sm:gap-2 ${
          isJanuaryCalendar ? "grid-cols-7" : "grid-cols-4 sm:grid-cols-7"
        }`}
      >
        {/* Empty cells for weekday alignment */}
        {Array.from({ length: weekdayOffset }, (_, index) => {
          const cellId = `empty-cell-${weekdayOffset}-${index}`;
          // Show empty cells on mobile for 31-day calendars (7 columns), hide for others
          return (
            <div
              key={cellId}
              className={isJanuaryCalendar ? "block" : "hidden sm:block"}
            />
          );
        })}
        {/* Calendar days */}
        {days.map((day) => renderDayButton(day))}
      </div>

      {selectedDay && (
        <RunLogForm
          day={selectedDay}
          instanceId={instanceId}
          onClose={() => setSelectedDay(null)}
          onSuccess={(runData) => {
            setSelectedDay(null);
            onRunSuccess(runData);
          }}
        />
      )}
    </div>
  );
}
