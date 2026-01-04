"use client";

import { type CreateClubState, createClubAction } from "@/app/actions/club-actions";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useEffect, useState } from "react";

interface CreateClubDialogProps {
  translations: {
    createClub: string;
    clubName: string;
    clubNamePlaceholder: string;
    clubDescription: string;
    clubDescriptionPlaceholder: string;
    optional: string;
    cancel: string;
    create: string;
    creating: string;
  };
  onSuccess?: () => void;
}

const initialState: CreateClubState = {
  success: false,
};

export function CreateClubDialog({ translations: t, onSuccess }: CreateClubDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createClubAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => setIsOpen(false), 0);
      if (onSuccess) onSuccess();
      router.refresh();
      return () => clearTimeout(timer);
    }
  }, [state.success, onSuccess, router]);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
      >
        {t.createClub}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {t.createClub}
        </h2>

        {state.error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {t.clubName}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              placeholder={t.clubNamePlaceholder}
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {t.clubDescription} <span className="text-zinc-400">({t.optional})</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              placeholder={t.clubDescriptionPlaceholder}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isPending ? t.creating : t.create}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
