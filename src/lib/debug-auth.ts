import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Check if debug/admin endpoints should be accessible
 * - In development: always allowed
 * - In production: requires X-Admin-Key header matching ADMIN_DEBUG_KEY env var
 */
export function checkDebugAccess(request: NextRequest): NextResponse | null {
  // Always allow in development
  if (process.env.NODE_ENV === "development") {
    return null;
  }

  // In production, require admin key
  const adminKey = request.headers.get("x-admin-key");
  const expectedKey = process.env.ADMIN_DEBUG_KEY;

  if (!expectedKey) {
    return NextResponse.json(
      { error: "Debug endpoints disabled in production" },
      { status: 403 }
    );
  }

  if (!adminKey || adminKey !== expectedKey) {
    return NextResponse.json(
      { error: "Unauthorized. Provide X-Admin-Key header." },
      { status: 401 }
    );
  }

  return null; // Access granted
}







