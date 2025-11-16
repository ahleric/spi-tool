import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { searchCatalog } from "@/lib/services/catalog";
import { recordEvent } from "@/lib/services/event";
import { rateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";

// This route depends on request headers and should always be dynamic
export const dynamic = "force-dynamic";

const querySchema = z.object({
  q: z.string().min(1, "请输入关键词或 Spotify 链接"),
});

function getClientIp(request: NextRequest): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || undefined;
}

export async function GET(request: NextRequest) {
  try {
    // Optional API key check (enabled only if configured)
    if (env.API_REQUEST_KEY) {
      const apiKey = request.headers.get("x-api-key");
      if (apiKey !== env.API_REQUEST_KEY) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    // Lightweight IP-based rate limit: 60 req/min per IP per route
    const ip = getClientIp(request) || "anon";
    const rl = rateLimit(`search:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.parse({ q: searchParams.get("q") });
    const query = parsed.q;

    const result = await searchCatalog(query);
    if (!result) {
      return NextResponse.json(
        { ok: false, error: "No artist or track found" },
        { status: 404 },
      );
    }

    try {
      await recordEvent({
        type: "search",
        input: query,
        artistId: result.type === "artist" ? result.id : (result as any).artistId,
        artistName: result.type === "artist" ? (result as any).name : undefined,
        trackId: result.type === "track" ? result.id : undefined,
        trackName: result.type === "track" ? (result as any).name : undefined,
        userAgent: request.headers.get("user-agent") || undefined,
        ip: getClientIp(request),
      });
    } catch (e) {
      // ignore analytics failure
      console.warn("search event logging failed", e);
    }

    if (result.type === "artist") {
      return NextResponse.json({
        ok: true,
        artistId: result.id,
        artistName: result.name,
      });
    } else {
      return NextResponse.json({
        ok: true,
        trackId: result.id,
        trackName: result.name,
        artistId: result.artistId,
      });
    }
  } catch (error) {
    console.error("Search API error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "Invalid query", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Search failed, please try again" },
      { status: 500 },
    );
  }
}
