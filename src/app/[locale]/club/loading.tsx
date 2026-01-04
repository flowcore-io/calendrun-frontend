import { ChallengeBackground } from "@/components/challenge-background";
import { themes } from "@/theme/themes";

export default function ClubLoading() {
  return (
    <>
      <ChallengeBackground
        backgroundImageDesktop={themes.january_winter.backgroundImageDesktop}
        backgroundImageMobile={themes.january_winter.backgroundImageMobile}
      />
      <main className="relative z-10 mx-auto max-w-4xl px-4 py-8">
        {/* Club Header Skeleton */}
        <div className="mb-8">
          <div className="h-9 w-48 animate-pulse rounded-md bg-white/20 backdrop-blur-sm" />
          <div className="mt-2 h-5 w-72 animate-pulse rounded-md bg-white/10 backdrop-blur-sm" />
        </div>

        {/* Leaderboard Section Skeleton */}
        <section>
          <div className="mb-4 h-7 w-32 animate-pulse rounded-md bg-white/20 backdrop-blur-sm" />

          {/* Leaderboard Table Skeleton */}
          <div className="overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-white/10 px-4 py-3">
              <div className="h-4 w-8 animate-pulse rounded bg-white/20" />
              <div className="h-4 flex-1 animate-pulse rounded bg-white/20" />
              <div className="h-4 w-16 animate-pulse rounded bg-white/20" />
              <div className="h-4 w-20 animate-pulse rounded bg-white/20" />
            </div>

            {/* Rows */}
            {[0, 1, 2, 3, 4].map((rowNum) => (
              <div
                key={`skeleton-row-${rowNum}`}
                className="flex items-center gap-4 border-b border-white/5 px-4 py-3 last:border-b-0"
                style={{ animationDelay: `${rowNum * 100}ms` }}
              >
                <div className="h-4 w-8 animate-pulse rounded bg-white/15" />
                <div className="h-4 flex-1 animate-pulse rounded bg-white/15" />
                <div className="h-4 w-16 animate-pulse rounded bg-white/15" />
                <div className="h-4 w-20 animate-pulse rounded bg-white/15" />
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
