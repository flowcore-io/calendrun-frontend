/**
 * User Settings Service
 *
 * Handles user settings/preferences.
 * User settings are read from the backend API (projected from Flowcore events).
 * Writes go through Flowcore ingestion.
 */

import { backendClient } from "./backend-client";
import { emitEvent, generateId } from "./flowcore-client";

export interface UserSettings {
  id: string;
  userId: string;
  preferences: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Convert backend API response to UserSettings domain model
 */
function apiToUserSettings(data: Record<string, unknown>): UserSettings {
  return {
    id: data.id as string,
    userId: data.userId as string,
    preferences: (data.preferences as Record<string, unknown>) ?? {},
    createdAt: data.createdAt as string | undefined,
    updatedAt: data.updatedAt as string | undefined,
  };
}

/**
 * Get user settings
 */
export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  try {
    const settings = await backendClient.get<Record<string, unknown>>("/api/user/settings", {
      userId,
    });
    return apiToUserSettings(settings);
  } catch {
    return null;
  }
}

/**
 * Update user settings (emits event to Flowcore)
 */
export async function updateUserSettings(
  userId: string,
  preferences: Record<string, unknown>
): Promise<UserSettings> {
  const id = generateId();

  // Emit user.settings.updated.0 event
  await emitEvent("user.settings.0", "user.settings.updated.0", {
    id,
    userId,
    preferences,
  });

  // Return settings (backend will process the event)
  return {
    id,
    userId,
    preferences,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Emit user settings updated event (alias for updateUserSettings)
 */
export async function emitUserSettingsUpdated(
  userId: string,
  preferences: Record<string, unknown>
): Promise<void> {
  await updateUserSettings(userId, preferences);
}
