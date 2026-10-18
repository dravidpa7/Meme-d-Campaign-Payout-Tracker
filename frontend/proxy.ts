import { NextRequest, NextResponse } from "next/server";

// This is an optimistic guard only. The protected server layout also decrypts
// and validates the session before rendering any protected page.
export function proxy(request: NextRequest) {
  const hasSessionCookie = Boolean(request.cookies.get("memed_session")?.value);

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "next",
      request.nextUrl.pathname + request.nextUrl.search,
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/brand/:path*", "/creator/:path*"],
};
