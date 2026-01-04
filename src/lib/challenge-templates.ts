/**
 * Challenge Template Service
 *
 * Business logic for managing challenge templates.
 * Challenge templates are read from the backend API (projected from Flowcore events).
 * Writes go through Flowcore ingestion.
 */

import type { ChallengeThemeKey } from "@/theme/themes";
import { backendClient } from "./backend-client";
import { emitEvent, generateId } from "./flowcore-client";

export interface ChallengeTemplate {
  id: string;
  name: string;
  description: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  days: number;
  requiredDistancesKm: number[];
  fullDistanceTotalKm: number;
  halfDistanceTotalKm: number;
  themeKey: ChallengeThemeKey;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convert backend API response to ChallengeTemplate domain model
 */
function apiToTemplate(data: Record<string, unknown>): ChallengeTemplate {
  return {
    id: data.id as string,
    name: data.name as string,
    description: data.description as string,
    startDate: data.startDate as string,
    endDate: data.endDate as string,
    days: (data.days as number) ?? 0,
    requiredDistancesKm: (data.requiredDistancesKm as number[]) ?? [],
    fullDistanceTotalKm: (data.fullDistanceTotalKm as number) ?? 0,
    halfDistanceTotalKm: (data.halfDistanceTotalKm as number) ?? 0,
    themeKey: (data.themeKey as ChallengeThemeKey) ?? "december_christmas",
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
}

/**
 * List all challenge templates
 */
export async function listChallengeTemplates(): Promise<ChallengeTemplate[]> {
  const templates = await backendClient.get<Record<string, unknown>[]>("/api/challenges/templates");
  return Array.isArray(templates) ? templates.map(apiToTemplate) : [];
}

/**
 * Get a single challenge template by ID
 */
export async function getChallengeTemplate(templateId: string): Promise<ChallengeTemplate | null> {
  try {
    const template = await backendClient.get<Record<string, unknown>>(
      `/api/challenges/templates/${templateId}`
    );
    return apiToTemplate(template);
  } catch {
    return null;
  }
}

/**
 * Create a new challenge template (emits event to Flowcore)
 */
export async function createChallengeTemplate(
  template: Omit<ChallengeTemplate, "id" | "createdAt" | "updatedAt">
): Promise<ChallengeTemplate> {
  const id = generateId();
  const now = new Date().toISOString();

  // Emit event to Flowcore
  // Note: Need to check if challenge.template.created.0 event type exists
  await emitEvent("challenge.template.0", "challenge.template.created.0", {
    id,
    name: template.name,
    description: template.description,
    startDate: template.startDate,
    endDate: template.endDate,
    days: template.days,
    requiredDistancesKm: template.requiredDistancesKm,
    fullDistanceTotalKm: template.fullDistanceTotalKm,
    halfDistanceTotalKm: template.halfDistanceTotalKm,
    themeKey: template.themeKey,
  });

  // Return the template with generated ID (backend will process the event)
  return {
    id,
    ...template,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update an existing challenge template (emits event to Flowcore)
 */
export async function updateChallengeTemplate(
  templateId: string,
  updates: Partial<Omit<ChallengeTemplate, "id" | "createdAt" | "updatedAt">>
): Promise<ChallengeTemplate> {
  // First get the existing template
  const existing = await getChallengeTemplate(templateId);
  if (!existing) {
    throw new Error(`Challenge template not found: ${templateId}`);
  }

  // Emit event to Flowcore
  await emitEvent("challenge.template.0", "challenge.template.updated.0", {
    id: templateId,
    ...updates,
  });

  // Return merged template (backend will process the event)
  return {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Delete a challenge template (emits event to Flowcore)
 */
export async function deleteChallengeTemplate(templateId: string): Promise<void> {
  // Get existing template first
  const existing = await getChallengeTemplate(templateId);
  if (!existing) {
    throw new Error(`Challenge template not found: ${templateId}`);
  }

  // Emit event to Flowcore
  await emitEvent("challenge.template.0", "challenge.template.deleted.0", {
    id: templateId,
  });
}

/**
 * Get the current month's active challenge template
 * Returns the challenge that is currently running (startDate <= now <= endDate)
 */
export async function getCurrentMonthChallenge(): Promise<ChallengeTemplate | null> {
  const templates = await listChallengeTemplates();
  const now = new Date();

  // Find the challenge that is currently active
  const currentChallenge = templates.find((template) => {
    const startDate = new Date(template.startDate);
    const endDate = new Date(template.endDate);
    return startDate <= now && now <= endDate;
  });

  return currentChallenge || null;
}
