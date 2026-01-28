import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getArtistDetail } from "@/lib/services/artist";
import { recordEvent } from "@/lib/services/event";
import { getCache, setCache } from "@/lib/memory-cache";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

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
    const parsedQuery = querySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );

    const cacheKey = `artist:${params.id}:page=${parsedQuery.page}:size=${parsedQuery.pageSize}`;
    let payload = getCache<Awaited<ReturnType<typeof getArtistDetail>>>(cacheKey);
    if (!payload) {
      payload = await getArtistDetail({
        artistId: params.id,
        page: parsedQuery.page,
        pageSize: parsedQuery.pageSize,
      });
      setCache(cacheKey, payload, 90_000);
    }

    await recordEvent({
      type: "artist_api",
      artistId: params.id,
      artistName: payload.artist?.name,
      userAgent: request.headers.get("user-agent") || undefined,
      ip: getClientIp(request),
    });

    return NextResponse.json({ ok: true, data: payload });
  } catch (error) {
    console.error("Artist API error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "Invalid query parameters", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Failed to fetch artist data" },
      { status: 500 },
    );
  }
}
