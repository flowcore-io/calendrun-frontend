import { getServerAuthSession } from "@/auth";
import { listChallengeInstances } from "@/lib/challenge-instances";
import { getChallengeTemplate } from "@/lib/challenge-templates";
import { NextResponse } from "next/server";

/**
 * GET /api/challenges/instances
 * Authenticated endpoint to list challenge instances for the current user.
 */
export async function GET() {
  const session = await getServerAuthSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const instances = await listChallengeInstances({ userId: session.user.id });

    // Fetch template details for each instance and filter out any with invalid templates
    const instancesWithTemplates = (
      await Promise.all(
        instances.map(async (instance) => {
          try {
            const template = await getChallengeTemplate(instance.templateId);
            if (!template) return null;
            return {
              id: instance.id,
              templateId: instance.templateId,
              templateName: template.name,
              variant: instance.variant,
              themeKey: instance.themeKey,
              status: instance.status,
              totalCompletedKm: instance.totalCompletedKm,
              succeeded: instance.succeeded,
              joinedAt: instance.joinedAt,
              completedAt: instance.completedAt,
              createdAt: instance.createdAt,
            };
          } catch {
            return null;
          }
        })
      )
    ).filter((item): item is NonNullable<typeof item> => item !== null);

    return NextResponse.json({
      instances: instancesWithTemplates,
    });
  } catch (error) {
    console.error("Error fetching instances:", error);
    return NextResponse.json({ error: "Failed to fetch instances" }, { status: 500 });
  }
}
