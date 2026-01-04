/**
 * Discount Code Service
 *
 * Business logic for managing discount codes.
 * Discount codes are read from the backend API (projected from Flowcore events).
 * Writes go through Flowcore ingestion.
 */

import { backendClient } from "./backend-client";
import { emitEvent, generateId } from "./flowcore-client";

export type DiscountType = "full" | "percentage" | "fixed";

export interface DiscountCode {
  id: string;
  code: string; // The actual code string (e.g., "CLUB2025-001")
  bundleId?: string; // Optional: link to Discount Bundle fragment
  discountType: DiscountType;
  discountValue: number; // 100 for full, percentage value, or fixed amount in smallest currency unit
  maxUses: number; // Maximum number of times this code can be used
  usedCount: number; // Current usage count
  expiresAt?: string; // ISO date string, optional expiration
  redeemedBy: string[]; // Array of userIds who have used this code
  createdBy: string; // Admin user who created the code
  isActive: boolean; // Whether the code is currently active
  createdAt: string;
  updatedAt: string;
}

/**
 * Generate a unique, non-guessable discount code
 */
export function generateCodeString(prefix?: string): string {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
  return prefix ? `${prefix}-${randomPart}${timestamp}` : `${randomPart}${timestamp}`;
}

/**
 * Convert backend API response to DiscountCode domain model
 */
function apiToDiscountCode(data: Record<string, unknown>): DiscountCode {
  return {
    id: data.id as string,
    code: data.code as string,
    bundleId: data.bundleId as string | undefined,
    discountType: (data.discountType as DiscountType) ?? "full",
    discountValue: (data.discountValue as number) ?? 100,
    maxUses: (data.maxUses as number) ?? 1,
    usedCount: (data.usedCount as number) ?? 0,
    expiresAt: data.expiresAt as string | undefined,
    redeemedBy: (data.redeemedBy as string[]) ?? [],
    createdBy: (data.createdBy as string) ?? "",
    isActive: (data.isActive as boolean) ?? true,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
}

/**
 * Convert a DiscountCode to Usable fragment content format
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _discountCodeToFragmentContent(
  code: Omit<DiscountCode, "id" | "createdAt" | "updatedAt">
): {
  title: string;
  summary: string;
  content: string;
  tags: string[];
} {
  const statusEmoji = code.isActive ? "🎟️" : "❌";
  const usageInfo = `${code.usedCount}/${code.maxUses} uses`;

  const content = `---
code: ${code.code}
discountType: ${code.discountType}
discountValue: ${code.discountValue}
maxUses: ${code.maxUses}
usedCount: ${code.usedCount}
isActive: ${code.isActive}
createdBy: ${code.createdBy}
redeemedBy: ${JSON.stringify(code.redeemedBy)}
${code.bundleId ? `bundleId: ${code.bundleId}` : ""}
${code.expiresAt ? `expiresAt: ${code.expiresAt}` : ""}
---

# ${statusEmoji} Discount Code: ${code.code}

## Details

- **Code**: \`${code.code}\`
- **Type**: ${code.discountType}${code.discountType === "percentage" ? ` (${code.discountValue}% off)` : code.discountType === "fixed" ? ` (${code.discountValue} off)` : " (100% off)"}
- **Status**: ${code.isActive ? "Active" : "Inactive"}
- **Usage**: ${usageInfo}
${code.expiresAt ? `- **Expires**: ${code.expiresAt}` : ""}
${code.bundleId ? `- **Bundle**: ${code.bundleId}` : ""}

## Redemption History

${code.redeemedBy.length > 0 ? code.redeemedBy.map((userId) => `- ${userId}`).join("\n") : "No redemptions yet."}

## Created By

- **Admin**: ${code.createdBy}
`;

  const tags = [
    "discount-code",
    `code:${code.code}`,
    code.isActive ? "active" : "inactive",
    `type:${code.discountType}`,
  ];

  if (code.bundleId) {
    tags.push(`bundle:${code.bundleId}`);
  }

  return {
    title: `Code: ${code.code}`,
    summary: `${code.discountType} discount code (${usageInfo})`,
    content,
    tags,
  };
}

/**
 * Get a discount code by its code string
 */
export async function getDiscountCodeByCode(codeString: string): Promise<DiscountCode | null> {
  try {
    const code = await backendClient.get<Record<string, unknown>>(
      `/api/discount-codes/validate/${codeString}`
    );
    return apiToDiscountCode(code);
  } catch {
    return null;
  }
}

/**
 * Get a discount code by ID
 */
export async function getDiscountCode(codeId: string): Promise<DiscountCode | null> {
  try {
    const code = await backendClient.get<Record<string, unknown>>(`/api/discount-codes/${codeId}`);
    return apiToDiscountCode(code);
  } catch {
    return null;
  }
}

/**
 * List all discount codes for a bundle
 */
export async function listDiscountCodesByBundle(bundleId: string): Promise<DiscountCode[]> {
  try {
    const codes = await backendClient.get<Record<string, unknown>[]>("/api/discount-codes", {
      bundleId,
    });
    return Array.isArray(codes) ? codes.map(apiToDiscountCode) : [];
  } catch {
    return [];
  }
}

/**
 * List all discount codes
 */
export async function listDiscountCodes(filters?: {
  bundleId?: string;
  userId?: string;
}): Promise<DiscountCode[]> {
  try {
    const codes = await backendClient.get<Record<string, unknown>[]>(
      "/api/discount-codes",
      filters
    );
    return Array.isArray(codes) ? codes.map(apiToDiscountCode) : [];
  } catch {
    return [];
  }
}

/**
 * Validate a discount code for redemption
 */
export async function validateDiscountCode(
  codeString: string,
  userId: string
): Promise<{ valid: boolean; code?: DiscountCode; error?: string }> {
  const code = await getDiscountCodeByCode(codeString);

  if (!code) {
    return { valid: false, error: "Code not found" };
  }

  if (!code.isActive) {
    return { valid: false, error: "Code is no longer active" };
  }

  if (code.usedCount >= code.maxUses) {
    return { valid: false, error: "Code has reached maximum uses" };
  }

  if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
    return { valid: false, error: "Code has expired" };
  }

  if (code.redeemedBy.includes(userId)) {
    return { valid: false, error: "You have already used this code" };
  }

  return { valid: true, code };
}

/**
 * Redeem a discount code (mark as used by a user) - emits event to Flowcore
 */
export async function redeemDiscountCode(
  codeString: string,
  userId: string
): Promise<DiscountCode> {
  const validation = await validateDiscountCode(codeString, userId);

  if (!validation.valid || !validation.code) {
    throw new Error(validation.error ?? "Invalid code");
  }

  const code = validation.code;

  // Emit discount.code.redeemed.0 event
  await emitEvent("discount.code.0", "discount.code.redeemed.0", {
    id: code.id,
    userId,
  });

  // Return updated code (backend will process the event)
  const updatedRedeemedBy = [...code.redeemedBy, userId];
  const updatedUsedCount = code.usedCount + 1;
  const shouldDeactivate = updatedUsedCount >= code.maxUses;

  return {
    ...code,
    usedCount: updatedUsedCount,
    redeemedBy: updatedRedeemedBy,
    isActive: shouldDeactivate ? false : code.isActive,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Create a new discount code (emits event to Flowcore)
 */
export async function createDiscountCode(
  code: Omit<DiscountCode, "id" | "usedCount" | "redeemedBy" | "createdAt" | "updatedAt">
): Promise<DiscountCode> {
  const id = generateId();
  const now = new Date().toISOString();

  // Emit discount.code.created.0 event
  await emitEvent("discount.code.0", "discount.code.created.0", {
    id,
    code: code.code,
    bundleId: code.bundleId,
    discountType: code.discountType,
    discountValue: code.discountValue,
    maxUses: code.maxUses,
    usedCount: 0,
    expiresAt: code.expiresAt,
    redeemedBy: [],
    createdBy: code.createdBy,
    isActive: code.isActive,
  });

  // Return the code with generated ID (backend will process the event)
  return {
    id,
    ...code,
    usedCount: 0,
    redeemedBy: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Create multiple discount codes at once (for bundles)
 */
export async function createDiscountCodes(
  count: number,
  baseConfig: Omit<
    DiscountCode,
    "id" | "code" | "usedCount" | "redeemedBy" | "createdAt" | "updatedAt"
  >,
  codePrefix?: string
): Promise<DiscountCode[]> {
  const codes: DiscountCode[] = [];

  for (let i = 0; i < count; i++) {
    const code = await createDiscountCode({
      ...baseConfig,
      code: generateCodeString(codePrefix),
    });
    codes.push(code);
  }

  return codes;
}

/**
 * Update an existing discount code (emits event to Flowcore)
 */
export async function updateDiscountCode(
  codeId: string,
  updates: Partial<Omit<DiscountCode, "id" | "code" | "createdBy" | "createdAt" | "updatedAt">>
): Promise<DiscountCode> {
  const existing = await getDiscountCode(codeId);
  if (!existing) {
    throw new Error(`Discount code not found: ${codeId}`);
  }

  // Emit discount.code.updated.0 event
  await emitEvent("discount.code.0", "discount.code.updated.0", {
    id: codeId,
    ...updates,
  });

  // Return merged code (backend will process the event)
  return {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Deactivate a discount code
 */
export async function deactivateDiscountCode(codeId: string): Promise<DiscountCode> {
  return updateDiscountCode(codeId, { isActive: false });
}

/**
 * Delete a discount code (emits event to Flowcore)
 */
export async function deleteDiscountCode(codeId: string): Promise<void> {
  const existing = await getDiscountCode(codeId);
  if (!existing) {
    throw new Error(`Discount code not found: ${codeId}`);
  }

  // Emit discount.code.deleted.0 event
  await emitEvent("discount.code.0", "discount.code.deleted.0", {
    id: codeId,
  });
}
