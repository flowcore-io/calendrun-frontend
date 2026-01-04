import { getServerAuthSession } from "@/auth";
import { getChallengeInstance, updateChallengeInstance } from "@/lib/challenge-instances";
import { getChallengeTemplate } from "@/lib/challenge-templates";
import { listRunPerformances } from "@/lib/run-performances";
import { type Variant, isValidVariant, variantToMultiplier } from "@/lib/variant-utils";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const UpdateInstanceSchema = z.object({
  variant: z
    .string()
    .refine((val): val is Variant => isValidVariant(val), {
      message: "Invalid variant. Must be 'full', 'half', or a fraction like '1/8', '2/8', etc.",
    })
    .optional(),
  status: z.enum(["active", "completed"]).optional(),
});

/**
 * GET /api/challenges/[instanceId]
 * Get a challenge instance by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { instanceId } = await params;

  try {
    const instance = await getChallengeInstance(instanceId);

    if (!instance) {
      return NextResponse.json({ error: "Challenge instance not found" }, { status: 404 });
    }

    // Only allow users to view their own instances
    if (instance.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json(instance);
  } catch (error) {
    console.error("Error fetching challenge instance:", error);
    return NextResponse.json({ error: "Failed to fetch challenge instance" }, { status: 500 });
  }
}

/**
 * PATCH /api/challenges/[instanceId]
 * Update a challenge instance (e.g., switch variant)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { instanceId } = await params;

  try {
    const body = await request.json();
    const updates = UpdateInstanceSchema.parse(body);

    // Get the current instance
    const instance = await getChallengeInstance(instanceId);

    if (!instance) {
      return NextResponse.json({ error: "Challenge instance not found" }, { status: 404 });
    }

    // Only allow users to update their own instances
    if (instance.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get the template for the instance name
    const template = await getChallengeTemplate(instance.templateId);

    if (!template) {
      return NextResponse.json({ error: "Challenge template not found" }, { status: 404 });
    }

    // Check if switching to a variant with higher requirements
    if (updates.variant) {
      const currentMultiplier = variantToMultiplier(instance.variant);
      const newMultiplier = variantToMultiplier(updates.variant as Variant);

      // If switching to a variant with higher requirements, validate existing runs
      if (newMultiplier > currentMultiplier) {
        // Get all completed runs for this instance
        const runs = await listRunPerformances({ instanceId });
        const completedRuns = runs.filter((r) => r.status === "completed");

        const startDate = new Date(template.startDate);
        const invalidRuns: {
          dayNumber: number;
          date: string;
          actualDistance: number;
          requiredDistance: number;
        }[] = [];

        for (const run of completedRuns) {
          const runDate = new Date(run.runDate);
          // Calculate day index (0-based)
          const msPerDay = 1000 * 60 * 60 * 24;
          const dayIndex = Math.floor((runDate.getTime() - startDate.getTime()) / msPerDay);

          if (dayIndex >= 0 && dayIndex < template.requiredDistancesKm.length) {
            const baseDistance = template.requiredDistancesKm[dayIndex] ?? 0;
            const requiredDistance = baseDistance * newMultiplier;

            // Check if the run distance meets the new variant requirement
            if (run.distanceKm < requiredDistance) {
              invalidRuns.push({
                dayNumber: dayIndex + 1,
                date: run.runDate,
                actualDistance: run.distanceKm,
                requiredDistance,
              });
            }
          }
        }

        if (invalidRuns.length > 0) {
          return NextResponse.json(
            {
              error: "VALIDATION_ERROR",
              details: invalidRuns,
            },
            { status: 400 }
          );
        }
      }
    }

    // Update the instance
    const updatedInstance = await updateChallengeInstance(
      instanceId,
      {
        ...updates,
        variant: updates.variant as Variant | undefined,
      },
      template.name
    );

    return NextResponse.json({
      ok: true,
      instance: updatedInstance,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating challenge instance:", error);
    return NextResponse.json({ error: "Failed to update challenge instance" }, { status: 500 });
  }
}
