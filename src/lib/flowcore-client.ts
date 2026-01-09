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
  console.log(`[emitEvent] Starting: ${flowTypeName}/${eventTypeName}`, {
    payload,
    dataCoreId: FLOWCORE_DATA_CORE_ID,
    tenant: FLOWCORE_TENANT,
  });

  if (!FLOWCORE_API_KEY) {
    console.error("[emitEvent] ❌ FLOWCORE_API_KEY is not configured");
    throw new Error("FLOWCORE_API_KEY is not configured");
  }

  if (!FLOWCORE_DATA_CORE_ID) {
    console.error("[emitEvent] ❌ FLOWCORE_DATA_CORE_ID is not configured");
    throw new Error("FLOWCORE_DATA_CORE_ID is not configured");
  }

  const ingestionUrl = buildIngestionUrl(flowTypeName, eventTypeName);
  console.log(`[emitEvent] Ingestion URL: ${ingestionUrl.replace(/key=[^&]+/, "key=***")}`);
  
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`[emitEvent] Attempt ${attempt + 1}/${maxRetries}...`);
      const response = await fetch(ingestionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[emitEvent] ❌ HTTP ${response.status}: ${errorText}`);
        throw new Error(`Flowcore ingestion failed: ${response.status} ${errorText}`);
      }

      const responseText = await response.text();
      console.log(`[emitEvent] ✅ Success! Response: ${responseText}`);
      return; // Success
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[emitEvent] ❌ Attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < maxRetries - 1) {
        // Exponential backoff: 250ms, 500ms, 1000ms
        const delay = 250 * 2 ** attempt;
        console.log(`[emitEvent] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.error("[emitEvent] ❌ All retries exhausted");
  throw lastError ?? new Error("Failed to emit event after retries");
}

/**
 * Generate UUID v4
 */
export function generateId(): string {
  return crypto.randomUUID();
}
