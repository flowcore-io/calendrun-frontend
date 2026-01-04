/**
 * Subscription Service
 *
 * Business logic for managing user subscriptions.
 * Subscriptions are read from the backend API (projected from Flowcore events).
 * Writes go through Flowcore ingestion.
 */

import { backendClient } from "./backend-client";
import { emitEvent, generateId } from "./flowcore-client";

export type SubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "trialing"
  | "incomplete"
  | "unpaid";

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string; // ISO date string
  currentPeriodEnd: string; // ISO date string
  priceId: string;
  discountCodeUsed?: string; // Optional: code used during checkout
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convert backend API response to Subscription domain model
 */
function apiToSubscription(data: Record<string, unknown>): Subscription {
  return {
    id: data.id as string,
    userId: data.userId as string,
    stripeCustomerId: data.stripeCustomerId as string,
    stripeSubscriptionId: data.stripeSubscriptionId as string,
    status: (data.status as SubscriptionStatus) ?? "incomplete",
    currentPeriodStart: data.currentPeriodStart as string,
    currentPeriodEnd: data.currentPeriodEnd as string,
    priceId: data.priceId as string,
    discountCodeUsed: data.discountCodeUsed as string | undefined,
    cancelAtPeriodEnd: (data.cancelAtPeriodEnd as boolean) ?? false,
    createdAt: data.createdAt as string,
    updatedAt: data.updatedAt as string,
  };
}

/**
 * Get subscription by user ID
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  try {
    const subscription = await backendClient.get<Record<string, unknown>>("/api/subscriptions", {
      userId,
    });
    return apiToSubscription(subscription);
  } catch {
    return null;
  }
}

/**
 * Get subscription by user ID (alias for getUserSubscription)
 */
export async function getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
  return getUserSubscription(userId);
}

/**
 * Get subscription by Stripe subscription ID
 */
export async function getSubscriptionByStripeId(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _stripeSubscriptionId: string
): Promise<Subscription | null> {
  // Backend doesn't have this endpoint yet, so we'll need to fetch by userId and filter
  // For now, return null - this will need backend support
  // TODO: Add backend endpoint for fetching by stripeSubscriptionId
  return null;
}

/**
 * Get subscription by Stripe customer ID
 */
export async function getSubscriptionByCustomerId(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _stripeCustomerId: string
): Promise<Subscription | null> {
  // Backend doesn't have this endpoint yet
  // TODO: Add backend endpoint for fetching by stripeCustomerId
  return null;
}

/**
 * Check if a user has an active subscription
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);
  return subscription?.status === "active" || subscription?.status === "trialing";
}

/**
 * List subscriptions (for admin use)
 */
export async function listSubscriptions(filters?: { userId?: string }): Promise<Subscription[]> {
  if (filters?.userId) {
    const subscription = await getUserSubscription(filters.userId);
    return subscription ? [subscription] : [];
  }
  return [];
}

/**
 * Create a new subscription (emits event to Flowcore)
 */
export async function createSubscription(
  subscription: Omit<Subscription, "id" | "createdAt" | "updatedAt">
): Promise<Subscription> {
  const id = generateId();
  const now = new Date().toISOString();

  // Emit subscription.created.0 event
  await emitEvent("subscription.0", "subscription.created.0", {
    id,
    userId: subscription.userId,
    stripeCustomerId: subscription.stripeCustomerId,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    status: subscription.status,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    priceId: subscription.priceId,
    discountCodeUsed: subscription.discountCodeUsed,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  });

  // Return the subscription with generated ID (backend will process the event)
  return {
    id,
    ...subscription,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update an existing subscription (emits event to Flowcore)
 * Note: Requires userId to fetch existing subscription from backend
 */
export async function updateSubscription(
  subscriptionId: string,
  userId: string,
  updates: Partial<Omit<Subscription, "id" | "userId" | "createdAt" | "updatedAt">>
): Promise<Subscription> {
  // First get the existing subscription
  const existing = await getUserSubscription(userId);
  if (!existing || existing.id !== subscriptionId) {
    throw new Error(`Subscription not found: ${subscriptionId}`);
  }

  // Emit subscription.updated.0 event
  await emitEvent("subscription.0", "subscription.updated.0", {
    id: subscriptionId,
    ...updates,
  });

  // Return merged subscription (backend will process the event)
  return {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Delete a subscription (emits event to Flowcore)
 */
export async function deleteSubscription(subscriptionId: string): Promise<void> {
  // Get existing subscription first (need userId to fetch)
  // Note: This is a limitation - we need userId to fetch from backend
  // For now, emit delete event with subscriptionId
  await emitEvent("subscription.0", "subscription.deleted.0", {
    id: subscriptionId,
  });
}

// Legacy function - no longer needed
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _subscriptionToFragmentContent(
  subscription: Omit<Subscription, "id" | "createdAt" | "updatedAt">
): {
  title: string;
  summary: string;
  content: string;
  tags: string[];
} {
  const statusEmoji = subscription.status === "active" ? "✅" : "⚠️";

  const content = `---
userId: ${subscription.userId}
stripeCustomerId: ${subscription.stripeCustomerId}
stripeSubscriptionId: ${subscription.stripeSubscriptionId}
status: ${subscription.status}
currentPeriodStart: ${subscription.currentPeriodStart}
currentPeriodEnd: ${subscription.currentPeriodEnd}
priceId: ${subscription.priceId}
cancelAtPeriodEnd: ${subscription.cancelAtPeriodEnd}
${subscription.discountCodeUsed ? `discountCodeUsed: ${subscription.discountCodeUsed}` : ""}
---

# ${statusEmoji} Subscription for User ${subscription.userId}

## Status

- **Status**: ${subscription.status}
- **Current Period**: ${subscription.currentPeriodStart} to ${subscription.currentPeriodEnd}
- **Cancel at Period End**: ${subscription.cancelAtPeriodEnd ? "Yes" : "No"}

## Stripe Details

- **Customer ID**: ${subscription.stripeCustomerId}
- **Subscription ID**: ${subscription.stripeSubscriptionId}
- **Price ID**: ${subscription.priceId}
${subscription.discountCodeUsed ? `- **Discount Code Used**: ${subscription.discountCodeUsed}` : ""}
`;

  return {
    title: `Subscription: ${subscription.userId}`,
    summary: `${subscription.status} subscription for user ${subscription.userId}`,
    content,
    tags: [
      "subscription",
      `user:${subscription.userId}`,
      `status:${subscription.status}`,
      `stripe-customer:${subscription.stripeCustomerId}`,
    ],
  };
}
