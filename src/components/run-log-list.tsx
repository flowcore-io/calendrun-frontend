"use client";

import type { RunPerformance } from "@/lib/run-performances";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RunLogForm } from "./run-log-form";

import { formatDate, formatDateTime } from "@/lib/date-utils";

type RunLogListProps = {
  runs: RunPerformance[];
};

type SortKey = "recorded" | "date" | "distance" | "time" | "notes";
type SortDirection = "asc" | "desc";

const SortIcon = ({ active, direction }: { active: boolean; direction: SortDirection }) => {
  if (!active) {
    return (
      <svg
        className="ml-1 h-3 w-3 text-zinc-400 opacity-0 group-hover:opacity-50"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      </svg>
    );
  }
  return direction === "asc" ? (
    <svg
      className="ml-1 h-3 w-3 text-emerald-600 dark:text-emerald-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg
      className="ml-1 h-3 w-3 text-emerald-600 dark:text-emerald-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
};

const SortableHeader = ({
  label,
  sortKey,
  active,
  direction,
  onSort,
  className = "",
}: {
  label: string;
  sortKey: SortKey;
  active: boolean;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
  className?: string;
}) => (
  <th
    className={`group cursor-pointer select-none px-3 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors ${className}`}
    onClick={() => onSort(sortKey)}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSort(sortKey);
      }
    }}
    aria-label={`Sort by ${label}`}
  >
    <div className="flex items-center">
      {label}
      <SortIcon active={active} direction={direction} />
    </div>
  </th>
);

export function RunLogList({ runs }: RunLogListProps) {
  const t = useTranslations("runLog");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [editingRun, setEditingRun] = useState<RunPerformance | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey;
    direction: SortDirection;
  }>({ key: "recorded", direction: "desc" });

  const handleSort = (key: SortKey) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "desc" ? "asc" : "desc",
    }));
  };

  const sortedRuns = [...runs].sort((a, b) => {
    const direction = sortConfig.direction === "asc" ? 1 : -1;

    switch (sortConfig.key) {
      case "recorded": {
        const timeA = new Date(a.recordedAt || a.createdAt).getTime();
        const timeB = new Date(b.recordedAt || b.createdAt).getTime();
        return (timeA - timeB) * direction;
      }
      case "date": {
        const timeA = new Date(a.runDate).getTime();
        const timeB = new Date(b.runDate).getTime();
        return (timeA - timeB) * direction;
      }
      case "distance":
        return (a.distanceKm - b.distanceKm) * direction;
      case "time":
        return ((a.timeMinutes || 0) - (b.timeMinutes || 0)) * direction;
      case "notes":
        return (a.notes || "").localeCompare(b.notes || "") * direction;
      default:
        return 0;
    }
  });

  return (
    <div className="w-full space-y-4">
      <div className="w-full max-w-full overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-0 divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50">
            <tr>
              <SortableHeader
                label={t("recorded")}
                sortKey="recorded"
                active={sortConfig.key === "recorded"}
                direction={sortConfig.direction}
                onSort={handleSort}
                className="hidden md:table-cell"
              />
              <SortableHeader
                label={t("date")}
                sortKey="date"
                active={sortConfig.key === "date"}
                direction={sortConfig.direction}
                onSort={handleSort}
              />
              <SortableHeader
                label={t("distance")}
                sortKey="distance"
                active={sortConfig.key === "distance"}
                direction={sortConfig.direction}
                onSort={handleSort}
              />
              <SortableHeader
                label={t("time")}
                sortKey="time"
                active={sortConfig.key === "time"}
                direction={sortConfig.direction}
                onSort={handleSort}
                className="hidden sm:table-cell"
              />
              <SortableHeader
                label={t("notes")}
                sortKey="notes"
                active={sortConfig.key === "notes"}
                direction={sortConfig.direction}
                onSort={handleSort}
                className="hidden lg:table-cell"
              />
              <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
            {sortedRuns.map((run) => (
              <tr key={run.id}>
                <td className="hidden md:table-cell whitespace-nowrap px-3 sm:px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                  {formatDateTime(run.recordedAt || run.createdAt)}
                </td>
                <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                  {formatDate(run.runDate)}
                </td>
                <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                  {run.distanceKm} km
                </td>
                <td className="hidden sm:table-cell whitespace-nowrap px-3 sm:px-6 py-4 text-sm text-zinc-900 dark:text-zinc-100">
                  {run.timeMinutes ? `${run.timeMinutes} min` : "-"}
                </td>
                <td className="hidden lg:table-cell whitespace-nowrap px-3 sm:px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs truncate">
                  {run.notes || "-"}
                </td>
                <td className="whitespace-nowrap px-3 sm:px-6 py-4 text-right text-sm font-medium">
                  <button
                    type="button"
                    onClick={() => setEditingRun(run)}
                    className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300"
                  >
                    {tCommon("edit")}
                  </button>
                </td>
              </tr>
            ))}
            {sortedRuns.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 sm:px-6 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400"
                >
                  {t("noRunsLogged")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingRun && (
        <RunLogForm
          day={{
            dayDate: editingRun.runDate,
            dayNumber: new Date(editingRun.runDate).getDate(), // Approximate
            plannedDistanceKm: editingRun.distanceKm, // Use actual as planned
            actualDistanceKm: editingRun.distanceKm,
            timeMinutes: editingRun.timeMinutes ?? null,
            notes: editingRun.notes ?? null,
            status: editingRun.status === "deleted" ? "planned" : editingRun.status,
            isToday: new Date(editingRun.runDate).toDateString() === new Date().toDateString(),
          }}
          instanceId={editingRun.instanceId}
          recordedAt={editingRun.recordedAt || editingRun.createdAt}
          onClose={() => setEditingRun(null)}
          onSuccess={() => {
            setEditingRun(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
