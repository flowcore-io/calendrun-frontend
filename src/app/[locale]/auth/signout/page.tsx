"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

export default function SignOutPage() {
  const tCommon = useTranslations("common");

  useEffect(() => {
    // Redirect to our custom Keycloak signout route
    // This route will:
    // 1. Clear NextAuth session cookies
    // 2. Redirect to Keycloak's logout endpoint with the id_token
    // 3. Keycloak will clear the SSO session and redirect back to our app
    window.location.href = "/api/auth/signout-keycloak";
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <p>{tCommon("loading")}</p>
      </div>
    </main>
  );
}
