import { listChallengeTemplates } from "@/lib/challenge-templates";
import { NextResponse } from "next/server";

/**
 * GET /api/challenges/templates
 * Public endpoint to list all available challenge templates.
 * Data is stored in Usable as fragments.
 */
export async function GET() {
  try {
    const templates = await listChallengeTemplates();

    return NextResponse.json({
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        startDate: t.startDate,
        endDate: t.endDate,
        days: t.days,
        fullDistanceTotalKm: t.fullDistanceTotalKm,
        halfDistanceTotalKm: t.halfDistanceTotalKm,
        themeKey: t.themeKey,
        createdAt: t.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}
