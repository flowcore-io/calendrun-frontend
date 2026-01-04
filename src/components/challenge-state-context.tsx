"use client";

import { type ReactNode, createContext, useContext, useEffect, useState } from "react";

type ChallengeStateContextType = {
  remainingDistances: number[];
  setRemainingDistances: React.Dispatch<React.SetStateAction<number[]>>;
};

const ChallengeStateContext = createContext<ChallengeStateContextType | undefined>(undefined);

export function ChallengeStateProvider({
  initialRemainingDistances,
  children,
}: {
  initialRemainingDistances: number[];
  children: ReactNode;
}) {
  const [remainingDistances, setRemainingDistances] = useState(initialRemainingDistances);

  // Sync with server state when props change (after router.refresh())
  // Only sync if server has fewer or equal distances (means it processed our run)
  useEffect(() => {
    if (
      initialRemainingDistances.length <= remainingDistances.length &&
      JSON.stringify(initialRemainingDistances) !== JSON.stringify(remainingDistances)
    ) {
      // Use setTimeout to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        setRemainingDistances(initialRemainingDistances);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [initialRemainingDistances, remainingDistances]);

  return (
    <ChallengeStateContext.Provider value={{ remainingDistances, setRemainingDistances }}>
      {children}
    </ChallengeStateContext.Provider>
  );
}

export function useChallengeState() {
  const context = useContext(ChallengeStateContext);
  if (!context) {
    throw new Error("useChallengeState must be used within ChallengeStateProvider");
  }
  return context;
}
