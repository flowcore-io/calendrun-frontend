import { ChristmasCalendarPreview, MonthCalendarPreview } from "@/components/calendar-previews";
import type { ThemeKey } from "@/theme/themes";
import { resolveTheme } from "@/theme/themes";
import { setRequestLocale } from "next-intl/server";

type ThemesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    theme?: string;
  }>;
};

const themeOptions: { key: ThemeKey; label: string }[] = [
  { key: "december_christmas", label: "December – Christmas" },
  { key: "january_winter", label: "January – Winter" },
];

export default async function ThemesPage({ params, searchParams }: ThemesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const resolvedSearchParams = await searchParams;
  const { key, tokens } = resolveTheme(resolvedSearchParams.theme);

  return (
    <main
      className="min-h-screen px-4 py-12"
      style={{
        backgroundColor: tokens.background,
        color: tokens.foreground,
      }}
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-8">
        <header className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold">Theme preview</h1>
          <p className="max-w-xl text-sm opacity-80">
            This page demonstrates the seasonal theme model. Use the theme switcher below to toggle
            between the December Christmas theme and the January winter theme.
          </p>
        </header>

        <section className="flex flex-wrap gap-3">
          {themeOptions.map((option) => {
            const isActive = option.key === key;

            return (
              <a
                key={option.key}
                href={`/${locale}/themes?theme=${option.key}`}
                className="rounded-full px-4 py-2 text-sm font-medium transition"
                style={{
                  backgroundColor: isActive ? tokens.accent : tokens.accentSoft,
                  color: tokens.background,
                  border: `1px solid ${tokens.border}`,
                  opacity: isActive ? 1 : 0.8,
                }}
              >
                {option.label}
              </a>
            );
          })}
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div
            className="rounded-xl p-6 shadow-sm"
            style={{ border: `1px solid ${tokens.border}` }}
          >
            <h2 className="mb-2 text-lg font-semibold">{tokens.name}</h2>
            <p className="mb-4 text-sm opacity-80">{tokens.description}</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="opacity-80">Theme key</dt>
                <dd className="font-mono">{key}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="opacity-80">Banner image key</dt>
                <dd className="font-mono">{tokens.bannerImageKey ?? "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="opacity-80">Accent</span>
              <span
                className="h-8 w-16 rounded-full border"
                style={{
                  backgroundColor: tokens.accent,
                  borderColor: tokens.border,
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="opacity-80">Accent (soft)</span>
              <span
                className="h-8 w-16 rounded-full border"
                style={{
                  backgroundColor: tokens.accentSoft,
                  borderColor: tokens.border,
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="opacity-80">Foreground on background</span>
              <span
                className="flex h-8 w-24 items-center justify-center rounded-full border text-xs font-medium"
                style={{
                  backgroundColor: tokens.background,
                  color: tokens.foreground,
                  borderColor: tokens.border,
                }}
              >
                Aa
              </span>
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-6 md:grid-cols-2">
          <ChristmasCalendarPreview tokens={tokens} />
          <MonthCalendarPreview tokens={tokens} daysInMonth={30} />
        </section>
      </div>
    </main>
  );
}
