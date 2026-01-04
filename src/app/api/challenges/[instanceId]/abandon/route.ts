import { getServerAuthSession } from "@/auth";
import { deleteChallengeInstance, getChallengeInstance } from "@/lib/challenge-instances";
import { deleteRunPerformancesForInstance } from "@/lib/run-performances";
import { type NextRequest, NextResponse } from "next/server";

/**
 * POST /api/challenges/[instanceId]/abandon
 * Archive a challenge instance (abandon the challenge)
 * Also soft-deletes all associated run performances to prevent
 * orphaned data and incorrect club statistics.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ instanceId: string }> }
) {
  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { instanceId } = await params;

  try {
    // Get the current instance
    const instance = await getChallengeInstance(instanceId);

    if (!instance) {
      return NextResponse.json({ error: "Challenge instance not found" }, { status: 404 });
    }

    // Only allow users to abandon their own instances
    if (instance.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // First, soft-delete all run performances for this challenge
    // This prevents orphaned performances from messing up club statistics
    const deletedPerformances = await deleteRunPerformancesForInstance(instanceId);
    console.log(`Soft-deleted ${deletedPerformances} run performances for instance ${instanceId}`);

    // Delete the challenge instance (emits Flowcore event)
    await deleteChallengeInstance(instanceId);

    return NextResponse.json({
      ok: true,
      message: "Challenge abandoned successfully",
      deletedPerformances,
    });
  } catch (error) {
    console.error("Error abandoning challenge:", error);
    return NextResponse.json({ error: "Failed to abandon challenge" }, { status: 500 });
  }
}
