import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureArtistRecord } from "@/lib/services/catalog";
import { getArtistIdFromInput, recordTrackFromSpotify, refreshSnapshotsForArtist } from "@/lib/spotify";

type SeedBody = {
  inputs?: string[];
  snapshotNow?: boolean;
};

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Restrict to owner for safety
  if (session.user.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as SeedBody;
  const rawInputs = Array.isArray(body.inputs) ? body.inputs : [];
  const items = Array.from(
    new Set(
      rawInputs
        .map((s) => String(s).trim())
        .filter((v) => v.length > 0),
    ),
  );
  if (!items.length) return NextResponse.json({ error: "Missing inputs" }, { status: 400 });
  const snapshotNow = Boolean(body.snapshotNow);

  const results: Array<{ input: string; ok: boolean; kind?: "artist" | "track"; id?: string; artistId?: string; error?: string }> = [];

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
      } else {
        const track = await recordTrackFromSpotify(lookup.id);
        if (track.artistId) {
          await ensureArtistRecord(track.artistId);
          if (snapshotNow) await refreshSnapshotsForArtist(track.artistId);
        }
        results.push({ input: raw, ok: true, kind: "track", id: track.id, artistId: track.artistId ?? undefined });
      }
    } catch (err) {
      results.push({ input: raw, ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  }

  const summary = { total: items.length, success: results.filter((r) => r.ok).length, failed: results.filter((r) => !r.ok).length };
  return NextResponse.json({ ok: true, summary, results });
}
