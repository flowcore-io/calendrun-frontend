"use client";

import { useChallengeState } from "./challenge-state-context";
import { RemainingDistances } from "./remaining-distances";

type ChallengeRemainingDistancesProps = {
  todaySuggestedDistance: number | null;
  hasBackgroundImage: boolean;
};

export function ChallengeRemainingDistances({
  todaySuggestedDistance,
  hasBackgroundImage,
}: ChallengeRemainingDistancesProps) {
  const { remainingDistances } = useChallengeState();

  return (
    <div className="relative rounded-lg p-6 space-y-2">
      {/* Only the title has a background for readability */}
      <h3
        className={`inline-block rounded-md px-3 py-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 ${
          hasBackgroundImage
            ? "bg-white/80 backdrop-blur-sm dark:bg-zinc-900/80"
            : "bg-white dark:bg-zinc-900"
        }`}
      >
        Remaining distances
      </h3>
      <RemainingDistances
        remainingDistances={remainingDistances}
        todaySuggestedDistance={todaySuggestedDistance}
        hideTitle
      />
    </div>
  );
}
