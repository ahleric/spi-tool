import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { backfillTrackMetadata } from "@/lib/services/backfill";

const MAX_BATCH = 200;

function extractCronSecret(request: Request): string | null {
  const fromHeader = request.headers.get("x-cron-key");
  const auth = request.headers.get("authorization");
  const fromAuth =
    auth && auth.toLowerCase().startsWith("bearer ")
      ? auth.slice("bearer ".length)
      : null;
  return fromHeader || fromAuth;
}

async function handle(request: Request) {
  // Same auth model as /api/cron/snapshot.
  if (process.env.NODE_ENV === "production") {
    if (!env.CRON_SECRET) {
      return NextResponse.json(
        { message: "Cron endpoint disabled in production" },
        { status: 403 },
      );
    }
    const secret = extractCronSecret(request);
    if (secret !== env.CRON_SECRET) {
      return NextResponse.json(
        { message: "Unauthorized. Provide X-Cron-Key header or Authorization Bearer token." },
        { status: 401 },
      );
    }
  } else if (env.CRON_SECRET) {
    const secret = extractCronSecret(request);
    if (secret && secret !== env.CRON_SECRET) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const parsed = Number(searchParams.get("batchSize"));
  const batchSize =
    Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, MAX_BATCH) : undefined;

  try {
    const data = await backfillTrackMetadata({ batchSize });
    return NextResponse.json({ ok: true, data, timestamp: new Date().toISOString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Backfill failed";
    console.error("Cron backfill error:", error);
    return NextResponse.json(
      { ok: false, message, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return handle(request);
}

export async function GET(request: Request) {
  return handle(request);
}
