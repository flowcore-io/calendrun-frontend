"use client";

import { type JoinClubState, joinClubAction } from "@/app/actions/club-actions";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";

interface JoinClubFormProps {
  translations: {
    joinClub: string;
    inviteToken: string;
    inviteTokenPlaceholder: string;
    cancel: string;
    join: string;
    joining: string;
  };
  onSuccess?: () => void;
  locale: string;
}

const initialState: JoinClubState = {
  success: false,
};

export function JoinClubForm({ translations: t, onSuccess, locale }: JoinClubFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(joinClubAction, initialState);
  const [showWelcome, setShowWelcome] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      if (state.welcomeText) {
        setTimeout(() => setShowWelcome(true), 0);
        router.refresh();
      } else {
        const timer = setTimeout(() => setIsOpen(false), 0);
        if (onSuccess) onSuccess();
        router.refresh();
        return () => clearTimeout(timer);
      }
    }
  }, [state.success, state.welcomeText, onSuccess, router]);

  const handleClose = () => {
    setIsOpen(false);
    setShowWelcome(false);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        {t.joinClub}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900 max-h-[80vh] overflow-y-auto">
        {showWelcome && state.welcomeText ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Welcome to {state.clubName}!
              </h2>
            </div>
            <div className="prose prose-sm dark:prose-invert">
              <Markdown>
                {state.welcomeText[locale as keyof typeof state.welcomeText] ||
                  state.welcomeText.en ||
                  ""}
              </Markdown>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              {t.joinClub}
            </h2>

            {state.error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <div>
                <label
                  htmlFor="inviteToken"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {t.inviteToken}
                </label>
                <input
                  type="text"
                  id="inviteToken"
                  name="inviteToken"
                  required
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  placeholder={t.inviteTokenPlaceholder}
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isPending ? t.joining : t.join}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
