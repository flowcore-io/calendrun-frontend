"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

type ChallengeProgressContextType = {
  totalCompletedKm: number;
  setTotalCompletedKm: React.Dispatch<React.SetStateAction<number>>;
};

const ChallengeProgressContext = createContext<ChallengeProgressContextType | undefined>(undefined);

export function ChallengeProgressProvider({
  initialTotalCompletedKm,
  children,
}: {
  initialTotalCompletedKm: number;
  children: React.ReactNode;
}) {
  const [totalCompletedKm, setTotalCompletedKm] = useState(initialTotalCompletedKm);

  // Sync with server state when props change (after router.refresh())
  // Only sync if server value is greater or equal (means it has our optimistic update)
  useEffect(() => {
    if (
      initialTotalCompletedKm >= totalCompletedKm &&
      initialTotalCompletedKm !== totalCompletedKm
    ) {
      // Use setTimeout to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        setTotalCompletedKm(initialTotalCompletedKm);
      }, 0);

      return () => clearTimeout(timeoutId);
    }
  }, [initialTotalCompletedKm, totalCompletedKm]);

  return (
    <ChallengeProgressContext.Provider value={{ totalCompletedKm, setTotalCompletedKm }}>
      {children}
    </ChallengeProgressContext.Provider>
  );
}

export function useChallengeProgress() {
  const context = useContext(ChallengeProgressContext);
  if (!context) {
    throw new Error("useChallengeProgress must be used within ChallengeProgressProvider");
  }
  return context;
}
