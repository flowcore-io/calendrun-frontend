"use client";

import { useForm } from "@tanstack/react-form";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { formatDate, formatDateTime } from "@/lib/date-utils";

type CalendarDay = {
  dayDate: string;
  dayNumber: number;
  plannedDistanceKm: number;
  actualDistanceKm: number | null;
  timeMinutes: number | null;
  notes: string | null;
  status: "planned" | "completed" | "skipped";
  isToday: boolean;
};

type RunLogFormProps = {
  day: CalendarDay;
  instanceId: string;
  recordedAt?: string;
  onClose: () => void;
  onSuccess: (runData: {
    dayDate: string;
    distanceKm: number;
    timeMinutes?: number;
    notes?: string;
    status: "planned" | "completed" | "skipped";
  }) => void;
};

export function RunLogForm({ day, instanceId, recordedAt, onClose, onSuccess }: RunLogFormProps) {
  const router = useRouter();
  const t = useTranslations("runLog");
  const tCommon = useTranslations("common");

  const form = useForm({
    defaultValues: {
      actualDistanceKm: day.actualDistanceKm
        ? Number(day.actualDistanceKm)
        : Number(day.plannedDistanceKm),
      timeMinutes: day.timeMinutes ? Number(day.timeMinutes) : undefined,
      notes: day.notes ?? "",
    },
    onSubmit: async ({ value }) => {
      // Optimistic update: Update UI immediately before API call
      onSuccess({
        dayDate: day.dayDate,
        distanceKm: value.actualDistanceKm,
        timeMinutes: value.timeMinutes,
        notes: value.notes || undefined,
        status: "completed",
      });

      try {
        const url = `/api/challenges/${instanceId}/runs`;
        const method = day.status === "completed" ? "PATCH" : "POST";

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dayDate: day.dayDate,
            actualDistanceKm: Number.parseFloat(String(value.actualDistanceKm)),
            timeMinutes:
              value.timeMinutes !== undefined && value.timeMinutes !== null
                ? Number(value.timeMinutes)
                : undefined,
            notes: value.notes?.trim() ? value.notes.trim() : undefined,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || t("failedToSave"));
        }

        const responseData = await response.json();
        
        // Dispatch event to update recent runs list immediately
        if (responseData.run && responseData.run.status === "completed") {
          window.dispatchEvent(
            new CustomEvent("club-run-added", {
              detail: responseData.run,
            })
          );
        }

        // Refresh data after successful save
        router.refresh();
      } catch (err) {
        // Since the modal is already closed due to optimistic update, use alert to notify user
        alert(err instanceof Error ? err.message : t("failedToSave"));
        // Force reload to revert state if save failed
        window.location.reload();
      }
    },
  });

  const handleDelete = async () => {
    if (!confirm(t("deleteConfirm"))) {
      return;
    }

    // Optimistic update: Update UI immediately before API call
    onSuccess({
      dayDate: day.dayDate,
      distanceKm: 0,
      status: "planned",
    });

    try {
      const response = await fetch(`/api/challenges/${instanceId}/runs`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dayDate: day.dayDate,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("failedToDelete"));
      }

      // Refresh data after successful delete
      router.refresh();
    } catch (err) {
      // Since the modal is already closed due to optimistic update, use alert to notify user
      alert(err instanceof Error ? err.message : t("failedToDelete"));
      // Force reload to revert state if delete failed
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {t("title", {
                dayNumber: day.dayNumber,
                date: formatDate(day.dayDate),
              })}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              ✕
            </button>
          </div>
          {recordedAt && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {t("recorded")}: {formatDateTime(recordedAt)}
            </p>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="actualDistanceKm"
            validators={{
              onChange: ({ value }) => {
                if (!value || value <= 0) {
                  return t("distanceError");
                }
                if (value < day.plannedDistanceKm) {
                  return t("distanceTooShort", {
                    minDistance: day.plannedDistanceKm,
                  });
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <div>
                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  {t("distance")}
                </label>
                <input
                  id={field.name}
                  type="number"
                  step="0.1"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(Number.parseFloat(e.target.value) || 0)}
                  onBlur={field.handleBlur}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder={day.plannedDistanceKm.toString()}
                />
                {field.state.meta.errors && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="timeMinutes">
            {(field) => (
              <div>
                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  {t("time")}
                </label>
                <input
                  id={field.name}
                  type="number"
                  value={field.state.value || ""}
                  onChange={(e) =>
                    field.handleChange(
                      e.target.value ? Number.parseInt(e.target.value, 10) : undefined
                    )
                  }
                  onBlur={field.handleBlur}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder={t("optional")}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="notes">
            {(field) => (
              <div>
                <label
                  htmlFor={field.name}
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
                >
                  {t("notes")}
                </label>
                <textarea
                  id={field.name}
                  value={field.state.value || ""}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  placeholder={t("notesPlaceholder")}
                />
              </div>
            )}
          </form.Field>

          {/* Error display removed as form closes immediately on submit */}

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {t("saveRun")}
            </button>
            {day.status === "completed" && (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                {tCommon("delete")}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
