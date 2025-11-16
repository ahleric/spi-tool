import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "spi_admin_session";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Allow login page without session
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Simple presence check; server pages will verify signature and active flag.
  const has = request.cookies.has(SESSION_COOKIE);
  if (!has) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = search ? `${search}&redirect=${encodeURIComponent(pathname)}` : `?redirect=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
