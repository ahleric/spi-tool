import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { getEvents, getEventMetrics, recordEvent } from "@/lib/services/event";
import { rateLimit } from "@/lib/rate-limit";
import { env } from "@/lib/env";

const createSchema = z.object({
  type: z.string().min(1),
  artistId: z.string().optional(),
  artistName: z.string().optional(),
  trackId: z.string().optional(),
  trackName: z.string().optional(),
  input: z.string().optional(),
  referrer: z.string().optional(),
  sessionId: z.string().optional(),
});

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  type: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  artist: z.string().optional(),
  track: z.string().optional(),
});

function getClientIp(request: NextRequest): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || undefined;
}

export async function POST(request: NextRequest) {
  try {
    // Optional API key check (enabled only if configured)
    if (env.API_REQUEST_KEY) {
      const apiKey = request.headers.get("x-api-key");
      if (apiKey !== env.API_REQUEST_KEY) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    // Rate limit event creation: 60 req/min per IP
    const ip = getClientIp(request) || "anon";
    const rl = rateLimit(`event:post:${ip}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429 });
    }

    const json = await request.json();
    const payload = createSchema.parse(json);
    // Persist referrer/sessionId inside input JSON for later analytics if needed
    const inputJson = JSON.stringify({
      input: payload.input,
      referrer: payload.referrer,
      sessionId: payload.sessionId,
    });
    const event = await recordEvent({
      type: payload.type,
      artistId: payload.artistId,
      artistName: payload.artistName,
      trackId: payload.trackId,
      trackName: payload.trackName,
      input: inputJson,
      userAgent: request.headers.get("user-agent") || undefined,
      ip: getClientIp(request),
    });
    // Note: referrer and sessionId are stored in the input field as JSON if needed
    // For now, we keep the schema simple and store them separately if needed later
    return NextResponse.json({ data: event }, { status: 201 });
  } catch (error) {
    console.error("Event logging error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "Invalid event data", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Failed to record event" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Optional API key check for read (if configured)
    if (env.API_REQUEST_KEY) {
      const apiKey = request.headers.get("x-api-key");
      if (apiKey !== env.API_REQUEST_KEY) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
      }
    }

    // Rate limit reads: 120 req/min per IP
    const ip = getClientIp(request) || "anon";
    const rl = rateLimit(`event:get:${ip}`, 120, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ ok: false, error: "Rate limit exceeded" }, { status: 429 });
    }

    const query = querySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );

    const filters = {
      type: query.type,
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      artistId: query.artist,
      trackId: query.track,
    };

    const [list, metrics] = await Promise.all([
      getEvents({
        page: query.page,
        pageSize: query.pageSize,
        filters,
      }),
      getEventMetrics(filters),
    ]);

    return NextResponse.json({ data: list, metrics });
  } catch (error) {
    console.error("Get events error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "Invalid query parameters", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Failed to fetch events" },
      { status: 500 },
    );
  }
}
