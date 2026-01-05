import { getServerAuthSession } from "@/auth";
import { getChallengeInstance } from "@/lib/challenge-instances";
import { getChallengeTemplate } from "@/lib/challenge-templates";
import { getClub, listMemberships } from "@/lib/club-service";
import {
  createRunPerformance,
  deleteRunPerformance,
  hasRunForDay,
  listRunPerformances,
  updateRunPerformance,
} from "@/lib/run-performances";
import { variantToMultiplier } from "@/lib/variant-utils";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateRunSchema = z.object({
  runDate: z.string().date(),
  distanceKm: z.number().positive(),
  timeMinutes: z.number().nonnegative().optional(),
  notes: z.string().max(500).optional(),
  status: z.enum(["planned", "completed", "skipped"]).default("completed"),
});

/**
 * POST /api/challenges/[instanceId]/runs
 * Create a new run performance for a challenge instance.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { instanceId } = await params;
    const body = await request.json();

    // Support both field name formats for compatibility
    const runDate = body.runDate ?? body.dayDate;
    const distanceKm = body.distanceKm ?? body.actualDistanceKm;

    const parsed = CreateRunSchema.parse({
      runDate,
      distanceKm,
      timeMinutes: body.timeMinutes,
      notes: body.notes,
      status: body.status ?? "completed",
    });

    const {
      runDate: validatedRunDate,
      distanceKm: validatedDistanceKm,
      timeMinutes,
      notes,
      status,
    } = parsed;

    // Verify instance exists and belongs to user
    const instance = await getChallengeInstance(instanceId);

    if (!instance) {
      return NextResponse.json({ error: "Challenge instance not found" }, { status: 404 });
    }

    if (instance.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: This challenge instance belongs to another user" },
        { status: 403 }
      );
    }

    // Validate minimum distance
    const template = await getChallengeTemplate(instance.templateId);
    if (!template) {
      return NextResponse.json({ error: "Challenge template not found" }, { status: 404 });
    }

    const startDate = new Date(template.startDate);
    const runDateObj = new Date(validatedRunDate);
    // Calculate day index (0-based)
    const dayIndex = Math.floor(
      (runDateObj.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayIndex >= 0 && dayIndex < template.days) {
      const baseDistance = template.requiredDistancesKm[dayIndex] ?? 0;
      const variantMultiplier = variantToMultiplier(instance.variant);
      const plannedDistanceKm = baseDistance * variantMultiplier;

      if (validatedDistanceKm < plannedDistanceKm) {
        return NextResponse.json(
          { error: `Distance must be at least ${plannedDistanceKm} km` },
          { status: 400 }
        );
      }
    }

    // Check if a run already exists for this day
    const existingRun = await hasRunForDay(instanceId, validatedRunDate);

    if (existingRun) {
      return NextResponse.json({ error: "A run already exists for this day" }, { status: 409 });
    }

    // Get user's club memberships to add club tags
    const memberships = await listMemberships({ userId: session.user.id });
    const clubPromises = memberships.map((m) => getClub(m.clubId));
    const clubs = await Promise.all(clubPromises);
    const clubInviteTokens = clubs
      .filter((club): club is NonNullable<typeof club> => club !== null)
      .map((club) => club.inviteToken);

    // Create the run performance in Usable
    const run = await createRunPerformance(
      {
        instanceId,
        userId: session.user.id,
        runnerName: session.user.name,
        runDate: validatedRunDate,
        distanceKm: validatedDistanceKm,
        timeMinutes,
        notes,
        status,
      },
      {
        clubInviteTokens,
        challengeTemplateId: instance.templateId,
      }
    );

    return NextResponse.json({
      ok: true,
      run: {
        id: run.id,
        instanceId: run.instanceId,
        userId: run.userId,
        runnerName: run.runnerName,
        runDate: run.runDate,
        distanceKm: run.distanceKm,
        timeMinutes: run.timeMinutes,
        notes: run.notes,
        status: run.status,
        createdAt: run.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating run:", error);
    return NextResponse.json({ error: "Failed to create run" }, { status: 500 });
  }
}

/**
 * PATCH /api/challenges/[instanceId]/runs
 * Update an existing run performance for a specific day.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { instanceId } = await params;
    const body = await request.json();

    // Support both field name formats for compatibility
    const runDate = body.runDate ?? body.dayDate;
    const distanceKm = body.distanceKm ?? body.actualDistanceKm;

    const dataToValidate = {
      runDate,
      distanceKm,
      timeMinutes: body.timeMinutes,
      notes: body.notes,
      status: body.status ?? "completed",
    };

    console.log("[PATCH /runs] Request body:", JSON.stringify(body, null, 2));
    console.log("[PATCH /runs] Data to validate:", JSON.stringify(dataToValidate, null, 2));

    const parsed = CreateRunSchema.parse(dataToValidate);

    const {
      runDate: validatedRunDate,
      distanceKm: validatedDistanceKm,
      timeMinutes,
      notes,
      status,
    } = parsed;

    // Verify instance exists and belongs to user
    const instance = await getChallengeInstance(instanceId);

    if (!instance) {
      return NextResponse.json({ error: "Challenge instance not found" }, { status: 404 });
    }

    if (instance.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: This challenge instance belongs to another user" },
        { status: 403 }
      );
    }

    // Validate minimum distance
    const template = await getChallengeTemplate(instance.templateId);
    if (!template) {
      return NextResponse.json({ error: "Challenge template not found" }, { status: 404 });
    }

    const startDate = new Date(template.startDate);
    const runDateObj = new Date(validatedRunDate);
    // Calculate day index (0-based)
    const dayIndex = Math.floor(
      (runDateObj.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayIndex >= 0 && dayIndex < template.days) {
      const baseDistance = template.requiredDistancesKm[dayIndex] ?? 0;
      const variantMultiplier = variantToMultiplier(instance.variant);
      const plannedDistanceKm = baseDistance * variantMultiplier;

      if (validatedDistanceKm < plannedDistanceKm) {
        return NextResponse.json(
          { error: `Distance must be at least ${plannedDistanceKm} km` },
          { status: 400 }
        );
      }
    }

    // Find the run for this day
    const runs = await listRunPerformances({
      instanceId,
      runDate: validatedRunDate,
    });

    if (runs.length === 0) {
      return NextResponse.json({ error: "No run found for this day" }, { status: 404 });
    }

    const runToUpdate = runs[0];
    if (!runToUpdate) {
      return NextResponse.json({ error: "No run found for this day" }, { status: 404 });
    }

    // Verify the run belongs to the current user
    if (runToUpdate.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: This run belongs to another user" },
        { status: 403 }
      );
    }

    // Update the run performance
    const updatedRun = await updateRunPerformance(runToUpdate.id, {
      runnerName: session.user.name,
      runDate: validatedRunDate,
      distanceKm: validatedDistanceKm,
      timeMinutes,
      notes,
      status,
    });

    return NextResponse.json({
      ok: true,
      run: {
        id: updatedRun.id,
        instanceId: updatedRun.instanceId,
        runDate: updatedRun.runDate,
        distanceKm: updatedRun.distanceKm,
        timeMinutes: updatedRun.timeMinutes,
        notes: updatedRun.notes,
        status: updatedRun.status,
        createdAt: updatedRun.createdAt,
        updatedAt: updatedRun.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[PATCH /runs] Validation error:", JSON.stringify(error.issues, null, 2));
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating run:", error);
    return NextResponse.json({ error: "Failed to update run" }, { status: 500 });
  }
}

/**
 * GET /api/challenges/[instanceId]/runs
 * List all runs for a challenge instance.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { instanceId } = await params;

    // Verify instance exists and belongs to user
    const instance = await getChallengeInstance(instanceId);

    if (!instance) {
      return NextResponse.json({ error: "Challenge instance not found" }, { status: 404 });
    }

    if (instance.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: This challenge instance belongs to another user" },
        { status: 403 }
      );
    }

    // Fetch all runs for this instance
    const runs = await listRunPerformances({ instanceId });

    return NextResponse.json({
      runs: runs.map((run) => ({
        id: run.id,
        runDate: run.runDate,
        distanceKm: run.distanceKm,
        timeMinutes: run.timeMinutes,
        notes: run.notes,
        status: run.status,
        createdAt: run.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching runs:", error);
    return NextResponse.json({ error: "Failed to fetch runs" }, { status: 500 });
  }
}

const DeleteRunSchema = z.object({
  dayDate: z.string().date(),
});

/**
 * DELETE /api/challenges/[instanceId]/runs
 * Soft-delete a run performance for a specific day.
 * The run is not actually deleted from Usable, but marked as deleted
 * with a "deleted" tag and will be excluded from future queries.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { instanceId } = await params;
    const body = await request.json();

    const { dayDate } = DeleteRunSchema.parse(body);

    // Verify instance exists and belongs to user
    const instance = await getChallengeInstance(instanceId);

    if (!instance) {
      return NextResponse.json({ error: "Challenge instance not found" }, { status: 404 });
    }

    if (instance.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: This challenge instance belongs to another user" },
        { status: 403 }
      );
    }

    // Find the run for this day
    const runs = await listRunPerformances({ instanceId, runDate: dayDate });

    if (runs.length === 0) {
      return NextResponse.json({ error: "No run found for this day" }, { status: 404 });
    }

    const runToDelete = runs[0];
    if (!runToDelete) {
      return NextResponse.json({ error: "No run found for this day" }, { status: 404 });
    }

    // Verify the run belongs to the current user
    if (runToDelete.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: This run belongs to another user" },
        { status: 403 }
      );
    }

    // Soft-delete the run (marks it as deleted with a tag)
    await deleteRunPerformance(runToDelete.id);

    return NextResponse.json({
      ok: true,
      message: "Run deleted successfully",
      deletedRunId: runToDelete.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error deleting run:", error);
    return NextResponse.json({ error: "Failed to delete run" }, { status: 500 });
  }
}
