import { env } from "@/env.mjs";
import { redirect } from "next/navigation";

export async function GET() {
  const registerUrl = `${env.KEYCLOAK_ISSUER}/protocol/openid-connect/registrations?client_id=${env.KEYCLOAK_CLIENT_ID}&response_type=code&scope=openid&redirect_uri=${encodeURIComponent(
    `${env.NEXTAUTH_URL}/api/auth/callback/keycloak`
  )}`;

  redirect(registerUrl);
}
