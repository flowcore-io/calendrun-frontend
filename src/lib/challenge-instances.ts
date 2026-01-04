/**
 * Challenge Instance Service
 *
 * Business logic for managing challenge instances.
 * Challenge instances are read from the backend API (projected from Flowcore events).
 * Writes go through Flowcore ingestion.
 */

import type { ChallengeThemeKey } from "@/theme/themes";
import { backendClient } from "./backend-client";
import { emitEvent, generateId } from "./flowcore-client";
import type { Variant } from "./variant-utils";

export interface ChallengeInstance {
  id: string;
  templateId: string;
  userId: string;
  variant: Variant;
  themeKey: ChallengeThemeKey;
  status: "active" | "completed";
  totalCompletedKm?: number;
  succeeded?: boolean;
  joinedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convert backend API response to ChallengeInstance domain model
 */
function apiToInstance(data: Record<string, unknown>): ChallengeInstance {
  return {
    id: data.id as string,
    templateId: data.templateId as string,
    userId: data.userId as string,
    variant: (data.variant as Variant) ?? "full",
    themeKey: (data.themeKey as ChallengeThemeKey) ?? "december_christmas",
    status: (data.status as "active" | "completed") ?? "active",
    totalCompletedKm: data.totalCompletedKm as number | undefined,
    succeeded: data.succeeded as boolean | undefined,
    joinedAt: data.joinedAt as string,
    completedAt: data.completedAt as string | undefined,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
}

/**
 * List all challenge instances (optionally filtered by user or template)
 */
export async function listChallengeInstances(filters?: {
  userId?: string;
  templateId?: string;
  status?: "active" | "completed";
}): Promise<ChallengeInstance[]> {
  if (filters?.templateId) {
    // Use templateId endpoint
    const instances = await backendClient.get<Record<string, unknown>[]>(
      "/api/challenges/instances",
      { templateId: filters.templateId }
    );
    return Array.isArray(instances) ? instances.map(apiToInstance) : [];
  }

  if (!filters?.userId) {
    throw new Error("userId or templateId filter is required");
  }

  const instances = await backendClient.get<Record<string, unknown>[]>(
    "/api/challenges/instances",
    { userId: filters.userId }
  );

  let result = Array.isArray(instances) ? instances.map(apiToInstance) : [];

  // Filter by status if needed (backend doesn't support status filter yet)
  if (filters?.status) {
    result = result.filter((instance) => instance.status === filters.status);
  }

  return result;
}

/**
 * List all challenge instances for a specific template
 * This is more efficient than fetching per-user when you need all instances for a template
 *
 * @param templateId - The challenge template ID
 * @param filters - Optional filters (status)
 * @returns Array of all challenge instances for the template
 */
export async function listChallengeInstancesByTemplate(
  templateId: string,
  filters?: { status?: "active" | "completed" }
): Promise<ChallengeInstance[]> {
  const instances = await backendClient.get<Record<string, unknown>[]>(
    "/api/challenges/instances",
    { templateId }
  );

  let result = Array.isArray(instances) ? instances.map(apiToInstance) : [];

  // Filter by status if needed (backend doesn't support status filter yet)
  if (filters?.status) {
    result = result.filter((instance) => instance.status === filters.status);
  }

  return result;
}

/**
 * Bulk fetch challenge instances for multiple users at once.
 * This is much more efficient than fetching per-user when dealing with many users.
 * Returns a Map of userId -> ChallengeInstance[]
 */
export async function listChallengeInstancesForUsers(
  userIds: string[],
  filters?: { status?: "active" | "completed" }
): Promise<Map<string, ChallengeInstance[]>> {
  if (userIds.length === 0) return new Map();

  // Fetch instances for all users in parallel
  const instancePromises = userIds.map((userId) =>
    listChallengeInstances({ userId, status: filters?.status })
  );

  const results = await Promise.all(instancePromises);

  // Group by userId
  const instancesByUser = new Map<string, ChallengeInstance[]>();
  for (let i = 0; i < userIds.length; i++) {
    const userId = userIds[i];
    const result = results[i];
    if (userId && result) {
      instancesByUser.set(userId, result);
    }
  }

  return instancesByUser;
}

/**
 * Get a single challenge instance by ID
 */
export async function getChallengeInstance(instanceId: string): Promise<ChallengeInstance | null> {
  try {
    const instance = await backendClient.get<Record<string, unknown>>(
      `/api/challenges/instances/${instanceId}`
    );
    return apiToInstance(instance);
  } catch {
    return null;
  }
}

/**
 * Create a new challenge instance (emits event to Flowcore)
 */
export async function createChallengeInstance(
  instance: Omit<ChallengeInstance, "id" | "createdAt" | "updatedAt">,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _templateName: string
): Promise<ChallengeInstance> {
  const id = generateId();
  const now = new Date().toISOString();

  // Emit event to Flowcore
  await emitEvent("challenge.0", "challenge.started.0", {
    id,
    templateId: instance.templateId,
    userId: instance.userId,
    variant: instance.variant,
    themeKey: instance.themeKey,
    status: instance.status,
    joinedAt: now,
  });

  // Return the instance with generated ID (backend will process the event)
  return {
    id,
    ...instance,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update an existing challenge instance
 */
export async function updateChallengeInstance(
  instanceId: string,
  updates: Partial<
    Omit<ChallengeInstance, "id" | "templateId" | "userId" | "createdAt" | "updatedAt">
  >,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _templateName: string
): Promise<ChallengeInstance> {
  // First get the existing instance
  const existing = await getChallengeInstance(instanceId);
  if (!existing) {
    throw new Error(`Challenge instance not found: ${instanceId}`);
  }

  // Emit event to Flowcore
  await emitEvent("challenge.0", "challenge.updated.0", {
    id: instanceId,
    ...updates,
  });

  // Return merged instance (backend will process the event)
  return {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Delete a challenge instance (abandon it)
 * Note: This should emit a Flowcore event instead of directly deleting
 * For now, we'll emit an update event with status change
 */
export async function deleteChallengeInstance(instanceId: string): Promise<void> {
  // Get existing instance first
  const existing = await getChallengeInstance(instanceId);
  if (!existing) {
    throw new Error(`Challenge instance not found: ${instanceId}`);
  }

  // Emit update event to mark as abandoned (backend can handle deletion logic)
  await emitEvent("challenge.0", "challenge.updated.0", {
    id: instanceId,
    status: "completed", // Or create a new "abandoned" status if needed
  });
}
