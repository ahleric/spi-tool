import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runSnapshotCron } from "@/lib/services/cron";

function extractCronSecret(request: Request): string | null {
  const url = new URL(request.url);
  const fromHeader = request.headers.get("x-cron-key");
  const fromQuery = url.searchParams.get("key");
  const auth = request.headers.get("authorization");
  const fromAuth =
    auth && auth.toLowerCase().startsWith("bearer ")
      ? auth.slice("bearer ".length)
      : null;
  return fromHeader || fromQuery || fromAuth;
}

async function handle(request: Request) {
  // Require CRON_SECRET in production
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
        { message: "Unauthorized. Provide X-Cron-Key header, Authorization Bearer token, or ?key= param." },
        { status: 401 },
      );
    }
  } else if (env.CRON_SECRET) {
    // In development, still check if CRON_SECRET is set
    const secret = extractCronSecret(request);
    if (secret && secret !== env.CRON_SECRET) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const data = await runSnapshotCron();
    return NextResponse.json({
      ok: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "执行快照任务失败";
    console.error("Cron snapshot error:", error);
    return NextResponse.json({
      ok: false,
      message: errorMessage,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return handle(request);
}

// Support Vercel Cron (GET by default)
export async function GET(request: Request) {
  return handle(request);
}
