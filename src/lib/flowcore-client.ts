/**
 * Flowcore Ingestion Client
 *
 * Client for emitting events to Flowcore ingestion endpoint
 *
 * URL format: https://webhook.api.flowcore.io/event/{tenant}/{dataCoreId}/{flowTypeName}/{eventTypeName}?key={apiKey}
 */

import { env } from "@/env.mjs";

const FLOWCORE_INGESTION_BASE_URL = env.FLOWCORE_INGESTION_BASE_URL;
const FLOWCORE_TENANT = env.FLOWCORE_TENANT;
const FLOWCORE_API_KEY = env.FLOWCORE_API_KEY;
const FLOWCORE_DATA_CORE_ID = env.FLOWCORE_DATA_CORE_ID;

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";

if (!FLOWCORE_API_KEY) {
  console.warn("⚠️  FLOWCORE_API_KEY not set - event emission will fail");
}

if (!FLOWCORE_DATA_CORE_ID) {
  console.warn("⚠️  FLOWCORE_DATA_CORE_ID not set - event emission will fail");
}

if (isDevMode) {
  console.log(`🔧 DEV MODE: Using datacore ID ${FLOWCORE_DATA_CORE_ID}`);
}

/**
 * Build Flowcore ingestion URL
 */
function buildIngestionUrl(flowTypeName: string, eventTypeName: string): string {
  const url = new URL(
    `/event/${FLOWCORE_TENANT}/${FLOWCORE_DATA_CORE_ID}/${flowTypeName}/${eventTypeName}`,
    FLOWCORE_INGESTION_BASE_URL
  );
  url.searchParams.set("key", FLOWCORE_API_KEY);
  return url.toString();
}

/**
 * Emit event to Flowcore ingestion endpoint
 */
export async function emitEvent(
  flowTypeName: string,
  eventTypeName: string,
  payload: unknown
): Promise<void> {
  if (!FLOWCORE_API_KEY) {
    throw new Error("FLOWCORE_API_KEY is not configured");
  }

  if (!FLOWCORE_DATA_CORE_ID) {
    throw new Error("FLOWCORE_DATA_CORE_ID is not configured");
  }

  const ingestionUrl = buildIngestionUrl(flowTypeName, eventTypeName);
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(ingestionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Flowcore ingestion failed: ${response.status} ${errorText}`);
      }

      return; // Success
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries - 1) {
        // Exponential backoff: 250ms, 500ms, 1000ms
        const delay = 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError ?? new Error("Failed to emit event after retries");
}

/**
 * Generate UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID();
}
