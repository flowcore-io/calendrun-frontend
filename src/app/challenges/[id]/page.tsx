import { redirect } from "next/navigation";

/**
 * Legacy route - redirects to locale-specific challenge page
 */
export default async function ChallengeCalendarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/en/challenges/${id}`);
}
