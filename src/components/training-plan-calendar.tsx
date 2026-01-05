"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

type TrainingPlanEntry = {
  date: string;
  training: string;
  intensity: string;
  distance: number;
  notes: string;
  trainingParts: Array<{
    description: string;
    intensity: string;
    distance: number;
    notes: string;
  }>;
};

type TrainingPlanCalendarProps = {
  month: number; // 1-12
  year: number;
};

type MonthNameKey = "january" | "february" | "march" | "april" | "may" | "june";

// Import training plan data
import trainingPlanData from "@/lib/bragdid-plan-2026.json";

const trainingPlan: TrainingPlanEntry[] = trainingPlanData;

// Helper functions to calculate week, day, and dayOfWeek from date
function calculateWeekFromDate(dateStr: string): number {
  // Use UTC dates to avoid DST issues
  const date = new Date(dateStr + 'T00:00:00Z');
  const week2StartMs = Date.UTC(2026, 0, 5); // Week 2 starts on Monday Jan 5, 2026
  const dateMs = date.getTime();
  const daysDiff = Math.floor((dateMs - week2StartMs) / (1000 * 60 * 60 * 24));
  return Math.floor(daysDiff / 7) + 2; // +2 because Week 2 starts Jan 5
}

function getFaroeseDayName(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  const dayOfWeek = date.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.

  // Faroese day names in order: Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
  const faroeseDays = ['Sunnudag', 'Mánadag', 'Týsdag', 'Mikudag', 'Hósdag', 'Fríggjadag', 'Leygardag'];
  return faroeseDays[dayOfWeek];
}

function formatEuropeanDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.getMonth() + 1; // getMonth() returns 0-based month
  const year = date.getFullYear();
  return `${day}/${month}-${year}`;
}

export function TrainingPlanCalendar({ month, year }: TrainingPlanCalendarProps) {
  const tTrainingPlan = useTranslations("trainingPlan");
  const [selectedDay, setSelectedDay] = useState<TrainingPlanEntry | null>(null);

  // Get month name from translations
  const monthKeys: MonthNameKey[] = ["january", "february", "march", "april", "may", "june"];
  const monthName = tTrainingPlan(`monthNames.${monthKeys[month - 1]}`);

  // Filter training plan entries for the selected month
  const monthEntries = trainingPlan.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate.getMonth() + 1 === month && entryDate.getFullYear() === year;
  });

  // Create a map of date -> training entry for quick lookup
  const entriesByDate = new Map<string, TrainingPlanEntry>();
  monthEntries.forEach(entry => {
    entriesByDate.set(entry.date, entry);
  });

  // Get all weeks that have entries in the selected month (calculate from dates)
  const weeksInMonth = new Set(monthEntries.map(entry => calculateWeekFromDate(entry.date)));

  // For each week in the month, get ALL entries for that week (across months)
  const weekTotals = new Map<number, number>();
  weeksInMonth.forEach(weekNum => {
    const weekEntries = trainingPlan.filter(entry => calculateWeekFromDate(entry.date) === weekNum);
    const totalDistance = weekEntries.reduce((sum, entry) => sum + entry.distance, 0);
    weekTotals.set(weekNum, totalDistance);
  });

  // Generate all days in the month
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const weekdayOffset = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0

  const days: Array<{ date: string; dayNumber: number; entry?: TrainingPlanEntry; isToday: boolean }> = [];

  // Add empty cells for alignment
  for (let i = 0; i < weekdayOffset; i++) {
    days.push({ date: '', dayNumber: 0, isToday: false });
  }

  // Add actual days
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const entry = entriesByDate.get(dateStr);

    days.push({
      date: dateStr,
      dayNumber: day,
      entry,
      isToday: dateStr === todayStr,
    });
  }

  const handleDayClick = (entry?: TrainingPlanEntry) => {
    if (entry) {
      setSelectedDay(entry);
    }
  };

  const handleCloseModal = () => {
    setSelectedDay(null);
  };

  return (
    <div className="space-y-6">
      {/* Month navigation header */}
      <div className="bg-white/70 backdrop-blur-md dark:bg-zinc-900/70 rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {monthName} {year}
          </h2>
        <div className="flex gap-2">
          {month > 1 && (
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={`/training-plan?month=${month - 1}`}>
                <ChevronLeft className="h-4 w-4" />
                {tTrainingPlan(`monthNames.${monthKeys[month - 2]}`)}
              </a>
            </Button>
          )}
          {month < 6 && (
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <a href={`/training-plan?month=${month + 1}`}>
                {tTrainingPlan(`monthNames.${monthKeys[month]}`)}
                <ChevronRight className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white/70 backdrop-blur-md dark:bg-zinc-900/70 rounded-lg p-4 shadow-lg">
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {[
            tTrainingPlan("dayNames.monday"),
            tTrainingPlan("dayNames.tuesday"),
            tTrainingPlan("dayNames.wednesday"),
            tTrainingPlan("dayNames.thursday"),
            tTrainingPlan("dayNames.friday"),
            tTrainingPlan("dayNames.saturday"),
            tTrainingPlan("dayNames.sunday")
          ].map(day => (
            <div key={day} className="text-center text-sm font-medium text-zinc-600 dark:text-zinc-400 py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleDayClick(day.entry)}
              disabled={!day.entry}
              className={`aspect-square flex flex-col items-center justify-center rounded-md border transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-30 ${
                day.isToday ? 'ring-2 ring-blue-500' : ''
              } ${
                day.entry ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <span className="text-sm font-medium">{day.dayNumber || ''}</span>
              {day.entry && (
                <span className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {day.entry.distance} km
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Training plan list */}
      <div className="bg-white/70 backdrop-blur-md dark:bg-zinc-900/70 rounded-lg p-4 shadow-lg">
        <h3 className="text-lg font-semibold mb-4">{tTrainingPlan("title")} - {monthName} {year}</h3>
        <div className="space-y-6">
          {monthEntries.length === 0 ? (
            <p className="text-zinc-600 dark:text-zinc-400">{tTrainingPlan("noTraining")}</p>
          ) : (
            // Group entries by week (only showing entries from current month)
            Array.from(weeksInMonth).sort((a, b) => a - b).map(weekNum => {
              const weekEntries = monthEntries.filter(entry => calculateWeekFromDate(entry.date) === weekNum);
              const weekTotal = weekTotals.get(weekNum) || 0;

              return (
                <div key={weekNum} className="space-y-3">
                  {/* Week header */}
                  <div className="border-b-2 border-blue-200 dark:border-blue-800 pb-2">
                    <h4 className="text-md font-semibold text-blue-700 dark:text-blue-300">
                      {tTrainingPlan("week")} {weekNum}
                    </h4>
                  </div>

                  {/* Week training entries (only from current month) */}
                  <div className="space-y-3 ml-4">
                    {weekEntries.map(entry => (
                      <div key={entry.date} className="border-b border-zinc-200 dark:border-zinc-700 pb-3 last:border-b-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{getFaroeseDayName(entry.date)}</span>
                              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                {formatEuropeanDate(entry.date)}
                              </span>
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {entry.distance} {tTrainingPlan("km")}
                              </span>
                            </div>
                            {entry.trainingParts.length > 1 ? (
                              <div className="space-y-2 mb-2">
                                {entry.trainingParts.map((part, index) => (
                                  <div key={index} className="text-sm border-l-2 border-blue-200 dark:border-blue-800 pl-3">
                                    <p className="font-medium">{part.description}</p>
                                    <p className="text-zinc-600 dark:text-zinc-400">
                                      {part.distance} km{part.intensity && ` • ${part.intensity}`}
                                    </p>
                                    {part.notes && (
                                      <p className="text-zinc-500 dark:text-zinc-500 mt-1">
                                        {part.notes}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-zinc-800 dark:text-zinc-200 mb-2">
                                {entry.training}
                              </p>
                            )}

                            {entry.notes && (
                              <div className="mt-2">
                                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                                  {entry.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Week summary (includes all days of the week) */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3 ml-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-700 dark:text-blue-300">
                        {tTrainingPlan("week")} {weekNum} {tTrainingPlan("total")}:
                      </span>
                      <span className="font-bold text-blue-700 dark:text-blue-300">
                        {weekTotal} {tTrainingPlan("km")}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Training details modal */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                {getFaroeseDayName(selectedDay.date)} - {formatEuropeanDate(selectedDay.date)}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                {tTrainingPlan("week")} {calculateWeekFromDate(selectedDay.date)} • {selectedDay.distance} km • {selectedDay.intensity}
              </p>
            </div>

            <div className="space-y-4">
              {selectedDay.trainingParts.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">{tTrainingPlan("trainingParts")}</h4>
                  <div className="space-y-2">
                    {selectedDay.trainingParts.map((part, index) => (
                      <div key={index} className="text-sm border-l-2 border-blue-200 dark:border-blue-800 pl-3">
                        <p className="font-medium">{part.description}</p>
                        <p className="text-zinc-600 dark:text-zinc-400">
                          {part.distance} km • {part.intensity}
                        </p>
                        {part.notes && (
                          <p className="text-zinc-500 dark:text-zinc-500 mt-1">
                            {part.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDay.notes && (
                <div>
                  <h4 className="font-medium mb-2">{tTrainingPlan("notes")}</h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {selectedDay.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={handleCloseModal}>
                {tTrainingPlan("close")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
