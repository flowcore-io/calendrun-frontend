import { authOptions } from "@/auth";
import { env } from "@/env.mjs";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Get the base URL for redirects.
 * CRITICAL: In production behind a proxy/load balancer (like Vercel), request.url
 * may contain internal hostnames. We prioritize environment variables that contain
 * the actual public URL.
 */
function getBaseUrl(request: NextRequest): string {
  // 1. Use NEXTAUTH_URL if explicitly set (most reliable for production)
  if (env.NEXTAUTH_URL) {
    return env.NEXTAUTH_URL;
  }

  // 2. On Vercel, use VERCEL_URL with HTTPS (Vercel sets this automatically)
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  // 3. Fallback to request URL (works for local development)
  return new URL(request.url).origin;
}

/**
 * Helper to clear all NextAuth session cookies properly.
 * The key issue: cookies must be deleted with the same attributes they were set with.
 * In production (HTTPS), NextAuth uses __Secure- prefixed cookies which require
 * secure=true and proper path settings to be deleted correctly.
 */
function clearAuthCookies(response: NextResponse, isSecure: boolean) {
  // Cookie options for clearing - must match how they were originally set
  const baseOptions = {
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  };

  if (isSecure) {
    // Production (HTTPS): NextAuth uses __Secure- prefix cookies
    const secureOptions = {
      ...baseOptions,
      secure: true,
      sameSite: "lax" as const,
    };

    // Primary session token - this is the most important one
    response.cookies.set("__Secure-next-auth.session-token", "", secureOptions);

    // CSRF token - may use __Host- prefix which requires stricter settings
    response.cookies.set("__Secure-next-auth.csrf-token", "", secureOptions);
    // __Host- cookies cannot have a domain and must have path=/
    response.cookies.set("__Host-next-auth.csrf-token", "", {
      ...baseOptions,
      secure: true,
      sameSite: "strict" as const,
    });

    // Callback URL cookie
    response.cookies.set("__Secure-next-auth.callback-url", "", secureOptions);

    // Also clear non-prefixed variants in case they exist (shouldn't on HTTPS, but just in case)
    response.cookies.set("next-auth.session-token", "", baseOptions);
    response.cookies.set("next-auth.csrf-token", "", baseOptions);
    response.cookies.set("next-auth.callback-url", "", baseOptions);
  } else {
    // Development (HTTP): NextAuth uses regular cookie names
    response.cookies.set("next-auth.session-token", "", baseOptions);
    response.cookies.set("next-auth.csrf-token", "", baseOptions);
    response.cookies.set("next-auth.callback-url", "", baseOptions);
  }
}

export async function GET(request: NextRequest) {
  // Determine the base URL for redirects
  // CRITICAL: In production behind a proxy/load balancer (like Vercel), request.url
  // may contain internal hostnames. We must use NEXTAUTH_URL or VERCEL_URL instead.
  const baseUrl = getBaseUrl(request);
  const isSecure = baseUrl.startsWith("https://");

  try {
    // Get the session to check if user is authenticated
    const session = await getServerSession(authOptions);

    if (!session) {
      // No session, but still clear cookies and redirect to home
      // This handles edge cases where session is gone but cookies remain
      const response = NextResponse.redirect(new URL("/", request.url));
      clearAuthCookies(response, isSecure);
      return response;
    }

    // Get the JWT token which contains the id_token
    const token = await getToken({
      req: request,
    });

    // If we don't have an id_token, we can't do a proper Keycloak logout.
    // Clear local cookies and redirect to home - this is the best we can do.
    if (!token?.idToken) {
      console.warn("Keycloak signout: missing id_token on JWT, clearing cookies only");
      const response = NextResponse.redirect(new URL("/", request.url));
      clearAuthCookies(response, isSecure);
      return response;
    }

    // Construct Keycloak logout URL.
    // IMPORTANT: `KEYCLOAK_ISSUER` already includes the realm path
    // (e.g. https://auth.flowcore.io/realms/calendarrunning), so we must
    // *append* the protocol segment instead of replacing the path.
    const keycloakLogoutUrl = new URL(`${env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout`);

    // Add post_logout_redirect_uri - must match what's registered in Keycloak
    // IMPORTANT: This URL must be registered in Keycloak client's "Valid post logout redirect URIs"
    keycloakLogoutUrl.searchParams.set("post_logout_redirect_uri", baseUrl);

    // Add id_token_hint (required by Keycloak for proper logout)
    keycloakLogoutUrl.searchParams.set("id_token_hint", token.idToken as string);

    // Add client_id to ensure Keycloak knows which client is logging out
    keycloakLogoutUrl.searchParams.set("client_id", env.KEYCLOAK_CLIENT_ID);

    // Create response with redirect to Keycloak logout endpoint
    const response = NextResponse.redirect(keycloakLogoutUrl.toString());

    // Clear all NextAuth session cookies
    clearAuthCookies(response, isSecure);

    // Redirect to Keycloak logout endpoint
    // This will clear the Keycloak SSO session, then redirect back to our app
    return response;
  } catch (error) {
    console.error("Sign out error:", error);
    // Fallback: clear cookies and redirect to home
    const response = NextResponse.redirect(new URL("/", request.url));
    clearAuthCookies(response, isSecure);
    return response;
  }
}
