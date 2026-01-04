import { redirect } from "next/navigation";

/**
 * Root page - redirects to the default locale
 * All actual content is served under /[locale]/ routes
 */
export default function Home() {
  redirect("/en");
}
