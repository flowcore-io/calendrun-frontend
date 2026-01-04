import { emitEvent } from "./flowcore-client";

/**
 * Sync user information from Keycloak to Flowcore
 * This ensures users are persisted in the CalendRun datacore
 */
export async function syncUser(
  userId: string,
  name?: string | null,
  email?: string | null
): Promise<void> {
  try {
    // Emit user.created or user.updated event
    // The backend handler will handle upsert logic
    await emitEvent("user.0", "user.created.0", {
      id: userId,
      name: name ?? undefined,
      email: email ?? undefined,
    });
  } catch (error) {
    // Log but don't throw - user sync shouldn't block other operations
    console.error("Failed to sync user to Flowcore:", error);
  }
}

/**
 * Update user information in Flowcore
 */
export async function updateUser(
  userId: string,
  updates: { name?: string | null; email?: string | null }
): Promise<void> {
  try {
    await emitEvent("user.0", "user.updated.0", {
      id: userId,
      name: updates.name ?? undefined,
      email: updates.email ?? undefined,
    });
  } catch (error) {
    console.error("Failed to update user in Flowcore:", error);
  }
}
