import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { suggestCatalog } from "@/lib/services/catalog";
import { rateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { getCache, setCache } from "@/lib/memory-cache";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  q: z.string().optional(),
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
    if (env.API_REQUEST_KEY) {
      const apiKey = request.headers.get("x-api-key");
      if (apiKey !== env.API_REQUEST_KEY) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    const ip = getClientIp(request) || "anon";
    const rl = rateLimit(`suggest:${ip}`, 120, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429 });
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.parse({ q: searchParams.get("q") || "" });
    const query = (parsed.q || "").trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ ok: true, suggestions: [] });
    }

    const cacheKey = `suggest:${query.toLowerCase()}`;
    let suggestions = getCache<Awaited<ReturnType<typeof suggestCatalog>>>(cacheKey);
    if (!suggestions) {
      suggestions = await suggestCatalog(query, 8);
      setCache(cacheKey, suggestions, 45_000);
    }
    return NextResponse.json({ ok: true, suggestions });
  } catch (error) {
    console.error("Suggest API error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "Invalid query", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Suggest failed, please try again" },
      { status: 500 },
    );
  }
}
