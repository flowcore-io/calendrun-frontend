import { redirect } from "next/navigation";

/**
 * Legacy route - redirects to locale-specific club page
 */
export default function ClubPage() {
  redirect("/en/club");
}
