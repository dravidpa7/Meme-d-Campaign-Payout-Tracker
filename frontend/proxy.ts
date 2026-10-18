import { NextResponse, type NextRequest } from 'next/server';

// Optimistic check only (cookie present). Real authorization happens
// server-side in lib/auth.ts, never rely on this alone.
export function proxy(req: NextRequest) {
  if (!req.cookies.has('memed_token')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/brand/:path*', '/creator/:path*'] };