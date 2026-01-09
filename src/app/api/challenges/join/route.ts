import { getServerAuthSession } from "@/auth";
import { createChallengeInstance, listChallengeInstances } from "@/lib/challenge-instances";
import { getChallengeTemplate } from "@/lib/challenge-templates";
import { type Variant, isValidVariant } from "@/lib/variant-utils";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const JoinChallengeSchema = z.object({
  templateId: z.string().uuid(),
  variant: z.string().refine((val): val is Variant => isValidVariant(val), {
    message: "Invalid variant. Must be 'full', 'half', or a fraction like '1/8', '2/8', etc.",
  }),
  inviteToken: z.string().optional(),
});

/**
 * POST /api/challenges/join
 * Authenticated endpoint for users to join a challenge template.
 * Creates a challenge instance in Usable for the current user.
 */
export async function POST(request: NextRequest) {
  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { templateId, variant } = JoinChallengeSchema.parse(body);

    console.log("[Join Challenge] Request received:", {
      templateId,
      variant,
      userId: session.user.id,
    });

    // Verify template exists
    let template: Awaited<ReturnType<typeof getChallengeTemplate>>;
    try {
      template = await getChallengeTemplate(templateId);
    } catch (err) {
      console.error("[Join Challenge] Error fetching template:", err);
      throw err;
    }

    if (!template) {
      return NextResponse.json({ error: "Challenge template not found" }, { status: 404 });
    }

    // Check if user already has an active instance for this template
    let existingInstances: Awaited<ReturnType<typeof listChallengeInstances>>;
    try {
      existingInstances = await listChallengeInstances({
        userId: session.user.id,
        templateId,
        status: "active",
      });
    } catch (err) {
      console.error("[Join Challenge] Error listing instances:", err);
      throw err;
    }

    console.log(
      "[Join Challenge] Existing instances found:",
      existingInstances.length,
      existingInstances.map((i) => ({ id: i.id, templateId: i.templateId }))
    );

    if (existingInstances.length > 0) {
      console.log("[Join Challenge] Returning 409 with instanceId:", existingInstances[0]?.id);
      return NextResponse.json(
        {
          error: "You already have an active instance of this challenge",
          instanceId: existingInstances[0]?.id,
        },
        { status: 409 }
      );
    }

    // Sync user to Flowcore before creating challenge
    console.log("[Join Challenge] About to sync user:", {
      userId: session.user.id,
      name: session.user.name,
      email: session.user.email,
    });
    const { syncUser } = await import("@/lib/user-service");
    await syncUser(session.user.id, session.user.name ?? null, session.user.email ?? null);
    console.log("[Join Challenge] User sync completed");

    // Handle club invite token if provided
    const { inviteToken } = body;
    if (inviteToken && typeof inviteToken === "string") {
      try {
        const { joinClub } = await import("@/lib/club-service");
        const result = await joinClub(
          session.user.id,
          inviteToken,
          session.user.name ?? undefined,
          session.user.email ?? undefined
        );
        if (!result.success) {
          console.warn("[Join Challenge] Failed to join club:", result.message);
          // Continue with challenge join even if club join fails
        } else {
          console.log("[Join Challenge] Successfully joined club:", result.club?.name);
        }
      } catch (err) {
        console.error("[Join Challenge] Error joining club:", err);
        // Continue with challenge join even if club join fails
      }
    }

    // Create the challenge instance in Usable
    console.log("[Join Challenge] About to create challenge instance:", {
      templateId,
      userId: session.user.id,
      variant,
      themeKey: template.themeKey,
    });
    const instance = await createChallengeInstance(
      {
        templateId,
        userId: session.user.id,
        variant: variant as Variant,
        themeKey: template.themeKey,
        status: "active",
        joinedAt: new Date().toISOString(),
      },
      template.name
    );
    console.log("[Join Challenge] ✅ Challenge instance created:", instance.id);

    return NextResponse.json({
      ok: true,
      instanceId: instance.id,
      templateId,
      variant,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error joining challenge:", error);
    return NextResponse.json({ error: "Failed to join challenge" }, { status: 500 });
  }
}
