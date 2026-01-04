"use client";

import { type UpdateClubState, updateClubAction } from "@/app/actions/club-actions";
import { Button } from "@/components/ui/button";
import type { Club } from "@/lib/club-service";
import { useActionState, useEffect, useState } from "react";

interface EditClubFormProps {
  club: Club;
  translations: {
    clubName: string;
    internalDescription: string;
    localizedContent: string;
    shortDescription: string;
    shortDescriptionPlaceholder: string;
    welcomeText: string;
    welcomeTextPlaceholder: string;
    saveChanges: string;
    saving: string;
    success: string;
    languages: {
      en: string;
      da: string;
      fo: string;
    };
  };
}

const initialState: UpdateClubState = {
  success: false,
};

export function EditClubForm({ club, translations: t }: EditClubFormProps) {
  const [activeTab, setActiveTab] = useState<"en" | "da" | "fo">("en");
  const updateAction = updateClubAction.bind(null, club.id);
  const [state, formAction, isPending] = useActionState(updateAction, initialState);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (state.success) {
      setTimeout(() => setShowMessage(true), 0);
      const timer = setTimeout(() => setShowMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.success]);

  return (
    <form action={formAction} className="space-y-6">
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
          defaultValue={club.name}
          required
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {t.internalDescription}
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={club.description}
          rows={2}
          className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
        />
      </div>

      <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <h3 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
          {t.localizedContent}
        </h3>

        <div className="mb-4 border-b border-zinc-200 dark:border-zinc-800">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {(["en", "da", "fo"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setActiveTab(lang)}
                className={`
                  whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium
                  ${
                    activeTab === lang
                      ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                      : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-300"
                  }
                `}
              >
                {t.languages[lang]}
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-4">
          <div className={activeTab === "en" ? "block" : "hidden"}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="shortDescriptionEn"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {t.shortDescription.replace("{lang}", t.languages.en)}
                </label>
                <textarea
                  id="shortDescriptionEn"
                  name="shortDescriptionEn"
                  defaultValue={club.shortDescription?.en}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-mono text-sm"
                  placeholder={t.shortDescriptionPlaceholder}
                />
              </div>
              <div>
                <label
                  htmlFor="welcomeTextEn"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {t.welcomeText.replace("{lang}", t.languages.en)}
                </label>
                <textarea
                  id="welcomeTextEn"
                  name="welcomeTextEn"
                  defaultValue={club.welcomeText?.en}
                  rows={5}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-mono text-sm"
                  placeholder={t.welcomeTextPlaceholder}
                />
              </div>
            </div>
          </div>

          <div className={activeTab === "da" ? "block" : "hidden"}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="shortDescriptionDa"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {t.shortDescription.replace("{lang}", t.languages.da)}
                </label>
                <textarea
                  id="shortDescriptionDa"
                  name="shortDescriptionDa"
                  defaultValue={club.shortDescription?.da}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-mono text-sm"
                  placeholder={t.shortDescriptionPlaceholder}
                />
              </div>
              <div>
                <label
                  htmlFor="welcomeTextDa"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {t.welcomeText.replace("{lang}", t.languages.da)}
                </label>
                <textarea
                  id="welcomeTextDa"
                  name="welcomeTextDa"
                  defaultValue={club.welcomeText?.da}
                  rows={5}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-mono text-sm"
                  placeholder={t.welcomeTextPlaceholder}
                />
              </div>
            </div>
          </div>

          <div className={activeTab === "fo" ? "block" : "hidden"}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="shortDescriptionFo"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {t.shortDescription.replace("{lang}", t.languages.fo)}
                </label>
                <textarea
                  id="shortDescriptionFo"
                  name="shortDescriptionFo"
                  defaultValue={club.shortDescription?.fo}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-mono text-sm"
                  placeholder={t.shortDescriptionPlaceholder}
                />
              </div>
              <div>
                <label
                  htmlFor="welcomeTextFo"
                  className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  {t.welcomeText.replace("{lang}", t.languages.fo)}
                </label>
                <textarea
                  id="welcomeTextFo"
                  name="welcomeTextFo"
                  defaultValue={club.welcomeText?.fo}
                  rows={5}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white font-mono text-sm"
                  placeholder={t.welcomeTextPlaceholder}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
          {showMessage && <p className="text-sm text-green-600 dark:text-green-400">{t.success}</p>}
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? t.saving : t.saveChanges}
        </Button>
      </div>
    </form>
  );
}
