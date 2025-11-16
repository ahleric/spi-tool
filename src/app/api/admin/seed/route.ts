import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { ensureArtistRecord } from "@/lib/services/catalog";
import { getArtistIdFromInput, recordTrackFromSpotify, refreshSnapshotsForArtist } from "@/lib/spotify";

type SeedBody = {
  inputs?: string[]; // names, URLs, URIs, or IDs
  artists?: string[]; // alias of inputs
  snapshotNow?: boolean;
};

export async function POST(request: Request) {
  // Protection: require CRON_SECRET in production, allow in development
  if (process.env.NODE_ENV === "production") {
    if (!env.CRON_SECRET) {
      return NextResponse.json({ message: "Seed endpoint disabled in production" }, { status: 403 });
    }
    const secret = request.headers.get("x-cron-key");
    if (secret !== env.CRON_SECRET) {
      return NextResponse.json({ message: "Unauthorized. Provide X-Cron-Key header." }, { status: 401 });
    }
  } else {
    // In development, still require CRON_SECRET if set, but allow without it
    if (env.CRON_SECRET) {
      const secret = request.headers.get("x-cron-key");
      if (secret && secret !== env.CRON_SECRET) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }
    }
  }

  let body: SeedBody | null = null;
  try {
    body = (await request.json()) as SeedBody;
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const items = body?.inputs?.length ? body.inputs : body?.artists ?? [];
  if (!items.length) {
    return NextResponse.json({ message: "Missing 'inputs' (array)" }, { status: 400 });
  }

  const snapshotNow = Boolean(body?.snapshotNow);

  const results: Array<{
    input: string;
    kind?: "artist" | "track";
    id?: string;
    artistId?: string;
    ok: boolean;
    error?: string;
  }> = [];

  for (const raw of items) {
    try {
      const lookup = await getArtistIdFromInput(raw);
      if (!lookup) {
        results.push({ input: raw, ok: false, error: "Not found" });
        continue;
      }

      if (lookup.type === "artist") {
        const artist = await ensureArtistRecord(lookup.id);
        if (snapshotNow) await refreshSnapshotsForArtist(artist.id);
        results.push({ input: raw, ok: true, kind: "artist", id: artist.id });
      } else if (lookup.type === "track") {
        const track = await recordTrackFromSpotify(lookup.id);
        if (track.artistId) {
          await ensureArtistRecord(track.artistId);
          if (snapshotNow) await refreshSnapshotsForArtist(track.artistId);
        }
        results.push({ input: raw, ok: true, kind: "track", id: track.id, artistId: track.artistId ?? undefined });
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      results.push({ input: raw, ok: false, error });
    }
  }

  const summary = {
    total: items.length,
    success: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
  };

  return NextResponse.json({ ok: true, summary, results });
}

