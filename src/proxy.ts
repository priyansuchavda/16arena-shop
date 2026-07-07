import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Legacy edge proxy stub. Route protection is enforced client-side via AuthGuard
 * because refresh tokens are HttpOnly cookies and access tokens are memory-only.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedPath =
    pathname.startsWith("/orders") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/notifications");

  if (isProtectedPath) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/orders/:path*", "/invoices/:path*", "/notifications/:path*"],
};
