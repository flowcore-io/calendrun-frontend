import { redirect } from "next/navigation";

/**
 * Legacy route - redirects to locale-specific profile page
 */
export default function ProfilePage() {
  redirect("/en/profile");
}
