import { NextResponse } from "next/server";
import { getArtistIdFromInput } from "@/lib/spotify";
import { getCache, setCache } from "@/lib/memory-cache";

// This route inspects request.url and should always be dynamic
export const dynamic = "force-dynamic";

function json(data: unknown, init?: number | ResponseInit) {
  const responseInit: ResponseInit = typeof init === "number" ? { status: init } : (init || {});
  const res = NextResponse.json(data, responseInit);
  res.headers.set("Content-Type", "application/json; charset=utf-8");
  return res;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const raw = (searchParams.get("q") || "").trim();
    
    if (!raw) {
      return json({ ok: false, status: 400, error: "Missing query 'q'." }, { status: 400 });
    }

    const cacheKey = `resolve:${raw.toLowerCase()}`;
    let lookup = await getCache<Awaited<ReturnType<typeof getArtistIdFromInput>>>(cacheKey);
    if (!lookup) {
      lookup = await getArtistIdFromInput(raw);
      if (lookup) {
        await setCache(cacheKey, lookup, 120_000);
      }
    }
    
    if (!lookup) {
      return json(
        { ok: false, status: 404, error: "No artist or track found for input." },
        { status: 404 },
      );
    }

    if (!(lookup as any).type || !(lookup as any).id) {
      console.error("[Resolve API] Invalid lookup result:", lookup);
      return json(
        { ok: false, status: 500, error: "Invalid lookup result from Spotify API." },
        { status: 500 },
      );
    }

    const result = { ok: true, kind: (lookup as any).type, id: (lookup as any).id };
    return json(result);
  } catch (err: unknown) {
    console.error("[Resolve API] Error:", err);
    let message = "Internal error resolving input.";
    let status = 500;
    
    if (err instanceof Error) {
      message = err.message;
      // Check if it's a rate limit error
      if (message.includes("rate limit") || message.includes("429")) {
        message = "搜索服务暂时繁忙，请稍后再试。";
        status = 429;
      } else if (message.includes("timeout") || message.includes("ETIMEDOUT")) {
        message = "请求超时，请稍后再试。";
        status = 504;
      } else if (message.includes("network") || message.includes("ECONNREFUSED")) {
        message = "网络连接失败，请检查网络后重试。";
        status = 503;
      }
    }
    
    return json({ ok: false, status, error: message }, { status });
  }
}
