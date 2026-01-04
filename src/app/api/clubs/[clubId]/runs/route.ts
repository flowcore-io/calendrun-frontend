import { getServerAuthSession } from "@/auth";
import { getClubRuns } from "@/lib/run-performances";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/clubs/[clubId]/runs
 * Get runs for a club
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clubId: string }> }
) {
  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clubId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const limit = searchParams.get("limit");
  const status = searchParams.get("status") as "planned" | "completed" | "skipped" | null;

  try {
    const runs = await getClubRuns(clubId, {
      limit: limit ? Number.parseInt(limit, 10) : undefined,
      status: status || undefined,
    });

    return NextResponse.json({ runs });
  } catch (error) {
    console.error("Error fetching club runs:", error);
    return NextResponse.json({ error: "Failed to fetch club runs" }, { status: 500 });
  }
}

