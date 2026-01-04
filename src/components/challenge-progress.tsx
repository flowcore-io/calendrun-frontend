"use client";

import { useChallengeProgress } from "./challenge-progress-context";

type ChallengeProgressProps = {
  targetKm: number;
};

export function ChallengeProgress({ targetKm }: ChallengeProgressProps) {
  const { totalCompletedKm } = useChallengeProgress();

  const progressPercentage = Math.round((totalCompletedKm / targetKm) * 100);

  return (
    <div className="text-right">
      <div className="text-2xl font-bold">{progressPercentage}%</div>
      <div className="text-xs text-zinc-500 dark:text-zinc-500">
        {totalCompletedKm} / {targetKm} km
      </div>
    </div>
  );
}
