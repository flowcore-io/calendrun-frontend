import type { ThemeTokens } from "@/theme/themes";

type CalendarPreviewProps = {
  tokens: ThemeTokens;
};

export function ChristmasCalendarPreview({ tokens }: CalendarPreviewProps) {
  const days = Array.from({ length: 24 }, (_, index) => index + 1);

  return (
    <section className="space-y-3 rounded-2xl bg-black/10 p-4 shadow-sm backdrop-blur-sm">
      <header className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Christmas calendar preview (24 doors)</h2>
        <p className="text-[11px] uppercase tracking-wide opacity-70">
          Visual only – placeholder doors
        </p>
      </header>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3">
        {days.map((day) => (
          <div
            key={day}
            className="flex aspect-square items-center justify-center rounded-lg border text-sm font-semibold shadow-sm transition-transform hover:-translate-y-0.5"
            style={{
              backgroundColor: tokens.accentSoft,
              borderColor: tokens.border,
              color: tokens.background,
            }}
          >
            {day}
          </div>
        ))}
      </div>
    </section>
  );
}

type MonthCalendarPreviewProps = CalendarPreviewProps & {
  daysInMonth?: number;
};

export function MonthCalendarPreview({ tokens, daysInMonth = 30 }: MonthCalendarPreviewProps) {
  const safeDays = Math.min(Math.max(daysInMonth, 28), 31);
  const days = Array.from({ length: safeDays }, (_, index) => index + 1);

  return (
    <section className="space-y-3 rounded-2xl bg-black/5 p-4 shadow-sm backdrop-blur-sm">
      <header className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">
          Generic month calendar preview ({safeDays}-day grid)
        </h2>
        <p className="text-[11px] uppercase tracking-wide opacity-70">
          Visual only – placeholder days
        </p>
      </header>
      <div className="grid grid-cols-4 gap-1.5 text-xs sm:grid-cols-7 sm:gap-2">
        {days.map((day) => (
          <div
            key={day}
            className="flex aspect-square items-center justify-center rounded-md border shadow-sm"
            style={{
              backgroundColor: tokens.background,
              borderColor: tokens.border,
              color: tokens.foreground,
            }}
          >
            {day}
          </div>
        ))}
      </div>
    </section>
  );
}
