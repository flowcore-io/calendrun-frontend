/**
 * Discount Bundle Service
 *
 * Business logic for managing discount bundles.
 * Discount bundles are read from the backend API (projected from Flowcore events).
 * Writes go through Flowcore ingestion.
 */

import { backendClient } from "./backend-client";
import {
  createDiscountCodes,
  generateCodeString,
  listDiscountCodesByBundle,
} from "./discount-codes";
import { emitEvent, generateId } from "./flowcore-client";

export type BundleStatus = "pending" | "active" | "expired" | "canceled";
export type PaymentMethod = "card" | "invoice";

export interface DiscountBundle {
  id: string;
  clubName: string;
  purchasedBy: string; // userId of the club admin
  contactEmail: string; // Email for invoice/communication
  paymentMethod: PaymentMethod;
  stripePaymentIntentId?: string; // For card payments
  stripeInvoiceId?: string; // For invoice payments
  status: BundleStatus;
  codeCount: number; // Number of codes in the bundle
  priceAmount: number; // In smallest currency unit (e.g., øre for DKK)
  priceCurrency: string; // ISO currency code (e.g., "dkk")
  codeIds: string[]; // Fragment IDs of the discount codes
  codePrefix?: string; // Optional prefix for generated codes (e.g., "CLUB2025")
  validUntil: string; // ISO date string - when codes expire
  createdAt: string;
  updatedAt: string;
}

/**
 * Convert backend API response to DiscountBundle domain model
 */
function apiToBundle(data: Record<string, unknown>): DiscountBundle {
  return {
    id: data.id as string,
    clubName: data.clubName as string,
    purchasedBy: data.purchasedBy as string,
    contactEmail: data.contactEmail as string,
    paymentMethod: (data.paymentMethod as PaymentMethod) ?? "card",
    stripePaymentIntentId: data.stripePaymentIntentId as string | undefined,
    stripeInvoiceId: data.stripeInvoiceId as string | undefined,
    status: (data.status as BundleStatus) ?? "pending",
    codeCount: (data.codeCount as number) ?? 0,
    priceAmount: (data.priceAmount as number) ?? 0,
    priceCurrency: (data.priceCurrency as string) ?? "dkk",
    codeIds: (data.codeIds as string[]) ?? [],
    codePrefix: data.codePrefix as string | undefined,
    validUntil: data.validUntil as string,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
}

/**
 * Format price for display
 */
function formatPrice(amount: number, currency: string): string {
  const majorUnits = amount / 100;
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(majorUnits);
}

/**
 * Convert a DiscountBundle to Usable fragment content format
 */
function bundleToFragmentContent(bundle: Omit<DiscountBundle, "id" | "createdAt" | "updatedAt">): {
  title: string;
  summary: string;
  content: string;
  tags: string[];
} {
  const statusEmoji =
    bundle.status === "active"
      ? "📦"
      : bundle.status === "pending"
        ? "⏳"
        : bundle.status === "expired"
          ? "❌"
          : "🚫";

  const content = `---
clubName: ${bundle.clubName}
purchasedBy: ${bundle.purchasedBy}
contactEmail: ${bundle.contactEmail}
paymentMethod: ${bundle.paymentMethod}
status: ${bundle.status}
codeCount: ${bundle.codeCount}
priceAmount: ${bundle.priceAmount}
priceCurrency: ${bundle.priceCurrency}
validUntil: ${bundle.validUntil}
codeIds: ${JSON.stringify(bundle.codeIds)}
${bundle.stripePaymentIntentId ? `stripePaymentIntentId: ${bundle.stripePaymentIntentId}` : ""}
${bundle.stripeInvoiceId ? `stripeInvoiceId: ${bundle.stripeInvoiceId}` : ""}
${bundle.codePrefix ? `codePrefix: ${bundle.codePrefix}` : ""}
---

# ${statusEmoji} Discount Bundle: ${bundle.clubName}

## Bundle Details

- **Club**: ${bundle.clubName}
- **Status**: ${bundle.status}
- **Code Count**: ${bundle.codeCount}
- **Price**: ${formatPrice(bundle.priceAmount, bundle.priceCurrency)}
- **Valid Until**: ${bundle.validUntil}

## Payment

- **Method**: ${bundle.paymentMethod}
${bundle.stripePaymentIntentId ? `- **Payment Intent**: ${bundle.stripePaymentIntentId}` : ""}
${bundle.stripeInvoiceId ? `- **Invoice**: ${bundle.stripeInvoiceId}` : ""}

## Contact

- **Purchased By**: ${bundle.purchasedBy}
- **Email**: ${bundle.contactEmail}

## Codes

This bundle contains ${bundle.codeCount} discount codes.
${bundle.codeIds.length > 0 ? `\nCode IDs:\n${bundle.codeIds.map((id) => `- ${id}`).join("\n")}` : "\nNo codes generated yet."}
`;

  const tags = [
    "discount-bundle",
    `club:${bundle.clubName.toLowerCase().replace(/\s+/g, "-")}`,
    `status:${bundle.status}`,
    `payment:${bundle.paymentMethod}`,
  ];

  return {
    title: `Bundle: ${bundle.clubName} (${bundle.codeCount} codes)`,
    summary: `${bundle.status} bundle for ${bundle.clubName} with ${bundle.codeCount} codes`,
    content,
    tags,
  };
}

/**
 * Get a discount bundle by ID
 */
export async function getDiscountBundle(bundleId: string): Promise<DiscountBundle | null> {
  try {
    const bundle = await backendClient.get<Record<string, unknown>>(
      `/api/discount-bundles/${bundleId}`
    );
    return apiToBundle(bundle);
  } catch {
    return null;
  }
}

/**
 * Get a discount bundle by Stripe payment intent ID
 * Note: Backend doesn't have this endpoint yet
 */
export async function getBundleByPaymentIntent(
  paymentIntentId: string
): Promise<DiscountBundle | null> {
  // TODO: Add backend endpoint for fetching by stripePaymentIntentId
  // For now, list all bundles and filter client-side
  const bundles = await listDiscountBundles();
  return bundles.find((b) => b.stripePaymentIntentId === paymentIntentId) ?? null;
}

/**
 * Get a discount bundle by Stripe invoice ID
 * Note: Backend doesn't have this endpoint yet
 */
export async function getBundleByInvoice(invoiceId: string): Promise<DiscountBundle | null> {
  // TODO: Add backend endpoint for fetching by stripeInvoiceId
  // For now, list all bundles and filter client-side
  const bundles = await listDiscountBundles();
  return bundles.find((b) => b.stripeInvoiceId === invoiceId) ?? null;
}

/**
 * List all bundles for a user (club admin)
 */
export async function listBundlesByUser(userId: string): Promise<DiscountBundle[]> {
  try {
    const bundles = await backendClient.get<Record<string, unknown>[]>("/api/discount-bundles", {
      purchasedBy: userId,
    });
    return Array.isArray(bundles) ? bundles.map(apiToBundle) : [];
  } catch {
    return [];
  }
}

/**
 * List all discount bundles
 */
export async function listDiscountBundles(filters?: {
  clubName?: string;
  purchasedBy?: string;
}): Promise<DiscountBundle[]> {
  try {
    const bundles = await backendClient.get<Record<string, unknown>[]>(
      "/api/discount-bundles",
      filters
    );
    return Array.isArray(bundles) ? bundles.map(apiToBundle) : [];
  } catch {
    return [];
  }
}

/**
 * Create a new discount bundle (emits event to Flowcore)
 */
export async function createDiscountBundle(
  bundle: Omit<DiscountBundle, "id" | "codeIds" | "status" | "createdAt" | "updatedAt">
): Promise<DiscountBundle> {
  const id = generateId();
  const now = new Date().toISOString();

  // Emit discount.bundle.purchased.0 event
  await emitEvent("discount.bundle.0", "discount.bundle.purchased.0", {
    id,
    clubName: bundle.clubName,
    purchasedBy: bundle.purchasedBy,
    contactEmail: bundle.contactEmail,
    paymentMethod: bundle.paymentMethod,
    stripePaymentIntentId: bundle.stripePaymentIntentId,
    stripeInvoiceId: bundle.stripeInvoiceId,
    status: "pending",
    codeCount: bundle.codeCount,
    priceAmount: bundle.priceAmount,
    priceCurrency: bundle.priceCurrency,
    codeIds: [],
    codePrefix: bundle.codePrefix,
    validUntil: bundle.validUntil,
  });

  // Return the bundle with generated ID (backend will process the event)
  return {
    id,
    ...bundle,
    status: "pending",
    codeIds: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Activate a bundle and generate its discount codes
 * Called after successful payment (via webhook)
 */
export async function activateBundle(bundleId: string): Promise<DiscountBundle> {
  const bundle = await getDiscountBundle(bundleId);
  if (!bundle) {
    throw new Error(`Bundle not found: ${bundleId}`);
  }

  if (bundle.status === "active") {
    return bundle; // Already active
  }

  // Generate the discount codes
  const codes = await createDiscountCodes(
    bundle.codeCount,
    {
      bundleId: bundle.id,
      discountType: "full", // Club codes give 100% off
      discountValue: 100,
      maxUses: 1,
      expiresAt: bundle.validUntil,
      createdBy: bundle.purchasedBy,
      isActive: true,
    },
    bundle.codePrefix ?? generateCodeString(bundle.clubName.substring(0, 4).toUpperCase())
  );

  const codeIds = codes.map((c) => c.id);

  // Update the bundle with code IDs and active status
  return updateDiscountBundle(bundleId, {
    status: "active",
    codeIds,
  });
}

/**
 * Update an existing discount bundle (emits event to Flowcore)
 */
export async function updateDiscountBundle(
  bundleId: string,
  updates: Partial<Omit<DiscountBundle, "id" | "purchasedBy" | "createdAt" | "updatedAt">>
): Promise<DiscountBundle> {
  const existing = await getDiscountBundle(bundleId);
  if (!existing) {
    throw new Error(`Bundle not found: ${bundleId}`);
  }

  // Emit discount.bundle.updated.0 event
  await emitEvent("discount.bundle.0", "discount.bundle.updated.0", {
    id: bundleId,
    ...updates,
  });

  // Return merged bundle (backend will process the event)
  return {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Get bundle with its codes (for admin view)
 */
export async function getBundleWithCodes(bundleId: string) {
  const bundle = await getDiscountBundle(bundleId);
  if (!bundle) {
    return null;
  }

  const codes = await listDiscountCodesByBundle(bundleId);

  return {
    bundle,
    codes,
  };
}

/**
 * Cancel a bundle (deactivate all its codes)
 */
export async function cancelBundle(bundleId: string): Promise<DiscountBundle> {
  // First deactivate all codes in the bundle
  const codes = await listDiscountCodesByBundle(bundleId);

  for (const code of codes) {
    if (code.isActive) {
      // Emit discount.code.updated.0 event to deactivate
      await emitEvent("discount.code.0", "discount.code.updated.0", {
        id: code.id,
        isActive: false,
      });
    }
  }

  // Then update the bundle status
  return updateDiscountBundle(bundleId, { status: "canceled" });
}

/**
 * Delete a discount bundle (emits event to Flowcore)
 */
export async function deleteDiscountBundle(bundleId: string): Promise<void> {
  const existing = await getDiscountBundle(bundleId);
  if (!existing) {
    throw new Error(`Discount bundle not found: ${bundleId}`);
  }

  // Emit discount.bundle.deleted.0 event
  await emitEvent("discount.bundle.0", "discount.bundle.deleted.0", {
    id: bundleId,
  });
}
