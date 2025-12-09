import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/spotify";

/**
 * Health check endpoint
 * Aggregates checks for database connectivity and Spotify token acquisition
 */
export async function GET() {
  const checks: Record<string, { ok: boolean; error?: string; latency?: number }> = {};

  // Check database connectivity
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = {
      ok: true,
      latency: Date.now() - dbStart,
    };
  } catch (err: any) {
    checks.database = {
      ok: false,
      error: err?.message || "Database connection failed",
      latency: Date.now() - dbStart,
    };
  }

  // Check Spotify token acquisition
  const spotifyStart = Date.now();
  try {
    const token = await auth();
    checks.spotify = {
      ok: !!token,
      latency: Date.now() - spotifyStart,
    };
  } catch (err: any) {
    checks.spotify = {
      ok: false,
      error: err?.message || "Spotify token acquisition failed",
      latency: Date.now() - spotifyStart,
    };
  }

  const allOk = Object.values(checks).every((c) => c.ok);
  const status = allOk ? 200 : 503;

  return NextResponse.json(
    {
      ok: allOk,
      checks,
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}












