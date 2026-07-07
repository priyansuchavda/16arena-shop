import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  const { pathname } = request.nextUrl;

  // Paths requiring authentication
  const isProtectedPath =
    pathname.startsWith("/orders") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/notifications");

  if (isProtectedPath && !token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/orders/:path*",
    "/invoices/:path*",
    "/notifications/:path*",
  ],
};
