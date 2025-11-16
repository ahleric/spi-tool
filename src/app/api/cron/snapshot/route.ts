import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runSnapshotCron } from "@/lib/services/cron";

export async function POST(request: Request) {
  // Require CRON_SECRET in production
  if (process.env.NODE_ENV === "production") {
    if (!env.CRON_SECRET) {
      return NextResponse.json({ message: "Cron endpoint disabled in production" }, { status: 403 });
    }
    const url = new URL(request.url);
    const secretFromHeader = request.headers.get("x-cron-key");
    const secretFromQuery = url.searchParams.get("key");
    const secret = secretFromHeader || secretFromQuery;
    if (secret !== env.CRON_SECRET) {
      return NextResponse.json({ message: "Unauthorized. Provide X-Cron-Key header or ?key= param." }, { status: 401 });
    }
  } else {
    // In development, still check if CRON_SECRET is set
    if (env.CRON_SECRET) {
      const url = new URL(request.url);
      const secretFromHeader = request.headers.get("x-cron-key");
      const secretFromQuery = url.searchParams.get("key");
      const secret = secretFromHeader || secretFromQuery;
      if (secret && secret !== env.CRON_SECRET) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
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
