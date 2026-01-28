import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getTrackDetail } from "@/lib/services/track";
import { recordEvent } from "@/lib/services/event";
import { getCache, setCache } from "@/lib/memory-cache";

function getClientIp(request: NextRequest): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || undefined;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const cacheKey = `track:${params.id}`;
    let data = getCache<Awaited<ReturnType<typeof getTrackDetail>>>(cacheKey);
    if (!data) {
      data = await getTrackDetail(params.id);
      if (data) {
        setCache(cacheKey, data, 90_000);
      }
    }
    if (!data) {
      return NextResponse.json({ message: "未找到该单曲" }, { status: 404 });
    }

    await recordEvent({
      type: "track_api",
      trackId: params.id,
      trackName: data.track.name,
      artistId: data.artist?.id,
      artistName: data.artist?.name,
      userAgent: request.headers.get("user-agent") || undefined,
      ip: getClientIp(request),
    });

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("Track API error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch track data" },
      { status: 500 },
    );
  }
}
