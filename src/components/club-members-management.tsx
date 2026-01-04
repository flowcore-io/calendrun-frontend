"use client";

import { removeMemberAction } from "@/app/actions/club-actions";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface Member {
  userId: string;
  userName?: string;
  joinedAt: string;
}

interface ClubMembersManagementProps {
  clubId: string;
  members: Member[];
  translations: {
    members: string;
    remove: string;
    removing: string;
    confirmRemove: string;
    noMembers: string;
  };
}

export function ClubMembersManagement({
  clubId,
  members,
  translations: t,
}: ClubMembersManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);
  const router = useRouter();

  const handleRemove = (userId: string, userName: string) => {
    if (!window.confirm(t.confirmRemove.replace("{name}", userName))) return;

    setRemovingUserId(userId);
    startTransition(async () => {
      const result = await removeMemberAction(clubId, userId);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error);
      }
      setRemovingUserId(null);
    });
  };

  return (
    <div className="rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {members.length === 0 ? (
        <div className="p-6 text-center text-zinc-500 dark:text-zinc-400">{t.noMembers}</div>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {members.map((member) => (
            <li key={member.userId} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  {member.userName || "Unknown User"}
                </div>
                <div className="text-xs text-zinc-500">ID: {member.userId}</div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(member.userId, member.userName || "User")}
                disabled={isPending && removingUserId === member.userId}
                className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                {isPending && removingUserId === member.userId ? t.removing : t.remove}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
