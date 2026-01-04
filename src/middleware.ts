import createMiddleware from "next-intl/middleware";
import { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  // Check for Vercel's geolocation header
  const country = request.headers.get("x-vercel-ip-country");

  // Check if user has already selected a locale
  const hasLocaleCookie = request.cookies.get("NEXT_LOCALE");

  // If user is in Faroe Islands and hasn't selected a locale, prefer Faroese
  // Only apply to GET requests to avoid interfering with form submissions or other methods
  if (request.method === "GET" && country === "FO" && !hasLocaleCookie) {
    const headers = new Headers(request.headers);
    // Prepend 'fo' to Accept-Language to make it the preferred language
    // This works because next-intl respects the Accept-Language header for locale detection
    headers.set("Accept-Language", `fo,${headers.get("Accept-Language") || ""}`);

    // Create a new request with the modified headers
    // We only need the URL and headers for next-intl to determine the locale
    const response = intlMiddleware(
      new NextRequest(request.url, {
        headers,
        method: request.method,
      })
    );
    return response;
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for:
  // - /api routes
  // - /health (Kubernetes liveness/readiness probes)
  // - /_next (Next.js internals)
  // - /_vercel (Vercel internals)
  // - /static files (favicon.ico, etc.)
  matcher: [
    "/((?!api|health|_next|_vercel|.*\\..*).*)",
    // Also match root
    "/",
  ],
};
