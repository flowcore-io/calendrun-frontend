import { getServerAuthSession } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { Link } from "@/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function ProtectedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tCommon = await getTranslations("common");
  const session = await getServerAuthSession();

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <p>You must be signed in to view this page.</p>
          <Link href="/api/auth/signin/keycloak" className="rounded bg-black px-4 py-2 text-white">
            {tCommon("signIn")} with Keycloak
          </Link>
        </div>
      </main>
    );
  }

  const roles = session.user.roles ?? [];
  const isSystemAdmin = roles.includes("system_admin");

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-xl font-semibold">Protected area</h1>
        <p>Signed in as: {session.user.email ?? session.user.id}</p>
        <p>Roles: {roles.length ? roles.join(", ") : "none"}</p>
        {isSystemAdmin ? (
          <p className="text-green-600">You have system_admin access to this page.</p>
        ) : (
          <p className="text-red-600">
            You do not have the system_admin role; some actions may be hidden.
          </p>
        )}
        <SignOutButton className="rounded bg-gray-800 px-4 py-2 text-white">
          {tCommon("signOut")}
        </SignOutButton>
      </div>
    </main>
  );
}
