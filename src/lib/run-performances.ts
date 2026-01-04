/**
 * Run Performance Service
 *
 * Business logic for managing run performances.
 * Run performances are read from the backend API (projected from Flowcore events).
 * Writes go through Flowcore ingestion.
 */

import { backendClient } from "./backend-client";
import { getChallengeTemplate } from "./challenge-templates";
import { emitEvent, generateId } from "./flowcore-client";

export interface ChangeLogEntry {
  timestamp: string;
  action: "created" | "updated" | "deleted";
  details?: string;
}

export interface RunPerformance {
  id: string;
  instanceId: string;
  userId: string;
  runnerName?: string | null;
  runDate: string; // ISO date string (alias for dayDate for consistency with frontend)
  distanceKm: number;
  timeMinutes?: number; // Duration in minutes
  notes?: string;
  status: "planned" | "completed" | "skipped" | "deleted"; // Status of the run
  recordedAt?: string; // ISO date string of when the performance was actually recorded
  changeLog?: ChangeLogEntry[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Convert backend API response to RunPerformance domain model
 */
function apiToRun(data: Record<string, unknown>): RunPerformance {
  // Normalize runDate to date-only format (strip timestamp if present)
  const rawRunDate = (data.runDate as string) ?? "";
  const runDate = rawRunDate.includes("T") ? (rawRunDate.split("T")[0] ?? rawRunDate) : rawRunDate;

  // Parse changeLog - handle both array and JSON string
  let changeLog: ChangeLogEntry[] = [];
  if (data.changeLog) {
    if (typeof data.changeLog === "string") {
      try {
        changeLog = JSON.parse(data.changeLog) as ChangeLogEntry[];
      } catch {
        changeLog = [];
      }
    } else if (Array.isArray(data.changeLog)) {
      changeLog = data.changeLog as ChangeLogEntry[];
    }
  }

  return {
    id: data.id as string,
    instanceId: data.instanceId as string,
    userId: data.userId as string,
    runnerName: (data.runnerName as string) || null,
    runDate,
    distanceKm: (data.distanceKm as number) ?? 0,
    timeMinutes: data.timeMinutes as number | undefined,
    notes: data.notes as string | undefined,
    status: (data.status as "planned" | "completed" | "skipped") ?? "completed",
    recordedAt: data.recordedAt as string | undefined,
    changeLog,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
}

/**
 * Format a date as ISO date string (yyyy-mm-dd)
 */
function formatDateISO(dateInput: string | Date): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  return date.toISOString().split("T")[0] ?? "";
}

/**
 * Generate month tag from challenge template start date
 * Format: month:YYYY-MM (e.g., "month:2026-01")
 */
async function getMonthTagForChallenge(templateId: string): Promise<string | null> {
  const template = await getChallengeTemplate(templateId);
  if (!template) return null;

  const startDate = new Date(template.startDate);
  const year = startDate.getFullYear();
  const month = String(startDate.getMonth() + 1).padStart(2, "0");

  return `month:${year}-${month}`;
}

/**
 * List all run performances (optionally filtered)
 */
export async function listRunPerformances(filters?: {
  userId?: string;
  instanceId?: string;
  runDate?: string;
}): Promise<RunPerformance[]> {
  const params: Record<string, string | undefined> = {};

  if (filters?.instanceId) {
    params.instanceId = filters.instanceId;
  }
  if (filters?.userId) {
    params.userId = filters.userId;
  }
  if (filters?.runDate) {
    params.runDate = filters.runDate;
  }

  const runs = await backendClient.get<Record<string, unknown>[]>("/api/runs", params);

  return Array.isArray(runs) ? runs.map(apiToRun) : [];
}

/**
 * Bulk fetch run performances for multiple users at once.
 * This is much more efficient than fetching per-user when dealing with many users.
 * Returns a Map of userId -> RunPerformance[]
 */
export async function listRunPerformancesForUsers(
  userIds: string[]
): Promise<Map<string, RunPerformance[]>> {
  if (userIds.length === 0) return new Map();

  // Fetch instances for all users in parallel
  const runPromises = userIds.map((userId) => listRunPerformances({ userId }));

  const results = await Promise.all(runPromises);

  // Group by userId
  const runsByUser = new Map<string, RunPerformance[]>();
  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    const result = results[i];
    if (userId && result) {
      runsByUser.set(userId, result);
    }
  }

  return runsByUser;
}

/**
 * List run performances by club and month
 * Uses backend API to fetch runs for club members
 *
 * @param clubInviteToken - Club invite token (e.g., "bragdid")
 * @param year - Year (e.g., 2026)
 * @param month - Month (1-12)
 * @returns Array of run performances
 */
export async function listRunPerformancesByClubAndMonth(
  clubInviteToken: string,
  year: number,
  month: number
): Promise<RunPerformance[]> {
  // Get club by invite token
  const club = await backendClient
    .get<Record<string, unknown>>("/api/clubs", {
      inviteToken: clubInviteToken,
    })
    .catch(() => null);

  if (!club || !club.id) {
    return [];
  }

  // Get club members
  const members = await backendClient
    .get<Record<string, unknown>[]>(`/api/clubs/${club.id as string}/members`)
    .catch(() => []);

  if (!Array.isArray(members) || members.length === 0) {
    return [];
  }

  const userIds = members
    .map((m) => (m as Record<string, unknown>).userId as string)
    .filter(Boolean);

  // Fetch runs for all members in parallel
  const runPromises = userIds.map((userId) => {
    // Format date range for the month
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = `${year}-${String(month).padStart(2, "0")}-31`;

    // Fetch runs for this user and filter by date range
    return listRunPerformances({ userId }).then((runs) =>
      runs.filter((run) => {
        const runDate = new Date(run.runDate);
        return runDate.getFullYear() === year && runDate.getMonth() + 1 === month;
      })
    );
  });

  const allRuns = (await Promise.all(runPromises)).flat();

  // Filter to only completed runs
  return allRuns.filter((run) => run.status === "completed");
}

/**
 * Get a single run performance by ID
 * @param includeDeleted - If true, includes soft-deleted runs (used internally for deletion process)
 */
export async function getRunPerformance(
  runId: string,
  includeDeleted = false
): Promise<RunPerformance | null> {
  try {
    const run = await backendClient.get<Record<string, unknown>>(`/api/runs/${runId}`);

    // Backend should filter deleted runs, but check status if needed
    if (!includeDeleted && (run.status as string) === "deleted") {
      return null;
    }

    return apiToRun(run);
  } catch {
    return null;
  }
}

/**
 * Create a new run performance (emits event to Flowcore)
 */
export async function createRunPerformance(
  run: Omit<RunPerformance, "id" | "createdAt" | "updatedAt">,
  options?: {
    clubInviteTokens?: string[];
    challengeTemplateId?: string;
  }
): Promise<RunPerformance> {
  const now = new Date().toISOString();
  const runId = generateId();

  const runWithDefaults = {
    ...run,
    recordedAt: run.recordedAt ?? now,
    changeLog: run.changeLog ?? [
      {
        timestamp: now,
        action: "created",
        details: `Created run with distance ${run.distanceKm}km${run.timeMinutes ? ` in ${run.timeMinutes}m` : ""}`,
      },
    ],
  };

  // Emit event to Flowcore
  await emitEvent("run.0", "run.logged.0", {
    id: runId,
    instanceId: run.instanceId,
    userId: run.userId,
    runnerName: run.runnerName,
    runDate: run.runDate,
    distanceKm: run.distanceKm,
    timeMinutes: run.timeMinutes,
    notes: run.notes,
    status: run.status,
    recordedAt: runWithDefaults.recordedAt,
    changeLog: runWithDefaults.changeLog,
  });

  // Return the run with generated ID (backend will process the event)
  return {
    id: runId,
    ...runWithDefaults,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update an existing run performance (emits event to Flowcore)
 */
export async function updateRunPerformance(
  runId: string,
  updates: Partial<Omit<RunPerformance, "id" | "instanceId" | "userId" | "createdAt" | "updatedAt">>
): Promise<RunPerformance> {
  // First get the existing run (from backend API)
  const existing = await getRunPerformance(runId);
  if (!existing) {
    throw new Error(`Run performance not found: ${runId}`);
  }

  const now = new Date().toISOString();

  // Generate change details
  const changes: string[] = [];
  if (updates.distanceKm && updates.distanceKm !== existing.distanceKm) {
    changes.push(`Distance: ${existing.distanceKm} -> ${updates.distanceKm}km`);
  }
  if (updates.timeMinutes !== undefined && updates.timeMinutes !== existing.timeMinutes) {
    changes.push(`Time: ${existing.timeMinutes ?? "none"} -> ${updates.timeMinutes ?? "none"}m`);
  }
  if (updates.status && updates.status !== existing.status) {
    changes.push(`Status: ${existing.status} -> ${updates.status}`);
  }
  if (updates.notes !== undefined && updates.notes !== existing.notes) {
    changes.push("Notes updated");
  }

  const newChangeLogEntry: ChangeLogEntry = {
    timestamp: now,
    action: "updated",
    details: changes.length > 0 ? changes.join(", ") : "Updated",
  };

  // Emit event to Flowcore
  await emitEvent("run.0", "run.updated.0", {
    id: runId,
    instanceId: existing.instanceId,
    userId: existing.userId,
    runnerName: updates.runnerName,
    runDate: updates.runDate,
    distanceKm: updates.distanceKm,
    timeMinutes: updates.timeMinutes,
    notes: updates.notes,
    status: updates.status,
    recordedAt: now,
    changeLog: [...(existing.changeLog || []), newChangeLogEntry],
  });

  // Return merged run (backend will process the event)
  return {
    ...existing,
    ...updates,
    recordedAt: now,
    changeLog: [...(existing.changeLog || []), newChangeLogEntry],
    updatedAt: now,
  };
}

/**
 * Delete a run performance (emits event to Flowcore)
 */
export async function deleteRunPerformance(runId: string): Promise<void> {
  const existing = await getRunPerformance(runId);
  if (!existing) {
    throw new Error(`Run performance not found: ${runId}`);
  }

  // Emit event to Flowcore
  await emitEvent("run.0", "run.deleted.0", {
    id: runId,
    instanceId: existing.instanceId,
    userId: existing.userId,
  });
}

/**
 * Get total distance for a challenge instance
 */
export async function getTotalDistanceForInstance(instanceId: string): Promise<number> {
  const runs = await listRunPerformances({ instanceId });
  return runs.reduce((total, run) => total + run.distanceKm, 0);
}

/**
 * Soft-delete all run performances for a challenge instance.
 * This is called when a challenge is abandoned/deleted to ensure
 * the performances don't mess up club statistics and can be properly cleaned up.
 * @returns The number of performances that were soft-deleted
 */
export async function deleteRunPerformancesForInstance(instanceId: string): Promise<number> {
  // Get all runs for this instance (non-deleted ones)
  const runs = await listRunPerformances({ instanceId });

  // Soft-delete each run
  let deletedCount = 0;
  for (const run of runs) {
    try {
      await deleteRunPerformance(run.id);
      deletedCount++;
    } catch (error) {
      console.error(`Failed to soft-delete run ${run.id}:`, error);
      // Continue with other runs even if one fails
    }
  }

  return deletedCount;
}

/**
 * Check if a run exists for a specific day
 */
export async function hasRunForDay(instanceId: string, runDate: string): Promise<boolean> {
  const runs = await listRunPerformances({ instanceId, runDate });
  return runs.length > 0;
}
