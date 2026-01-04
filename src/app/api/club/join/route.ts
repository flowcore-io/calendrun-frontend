import { getServerAuthSession } from "@/auth";
import { joinClub } from "@/lib/club-service";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const locale = request.cookies.get("NEXT_LOCALE")?.value || "en";
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get("club");
  const session = await getServerAuthSession();

  if (!token) {
    return NextResponse.redirect(new URL(`/${locale}/club`, request.url));
  }

  if (!session) {
    // Redirect to custom sign in page that auto-redirects to Keycloak
    const callbackUrl = encodeURIComponent(request.url);
    return NextResponse.redirect(
      new URL(`/${locale}/auth/signin?callbackUrl=${callbackUrl}`, request.url)
    );
  }

  const result = await joinClub(
    session.user.id,
    token,
    session.user.name ?? undefined,
    session.user.email ?? undefined
  );

  if (result.success) {
    // Redirect to club page with success message
    return NextResponse.redirect(
      new URL(`/${locale}/club?joined=true&clubName=${result.club?.name}`, request.url)
    );
  }
  // Redirect with error
  return NextResponse.redirect(
    new URL(`/${locale}/club?error=${encodeURIComponent(result.message)}`, request.url)
  );
}
