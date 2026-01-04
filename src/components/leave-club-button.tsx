"use client";

import { leaveClubAction } from "@/app/actions/club-actions";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface LeaveClubButtonProps {
  clubId: string;
  translations: {
    leaveClub: string;
    confirmLeave: string;
    leaving: string;
  };
}

export function LeaveClubButton({ clubId, translations: t }: LeaveClubButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleLeave = () => {
    if (!window.confirm(t.confirmLeave)) return;

    startTransition(async () => {
      const result = await leaveClubAction(clubId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleLeave}
      disabled={isPending}
      className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
    >
      {isPending ? t.leaving : t.leaveClub}
    </button>
  );
}
