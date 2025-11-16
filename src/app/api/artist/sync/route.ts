import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import {
  recordArtistFromSpotify,
  getArtistTopTracks,
  recordTrackFromSpotify,
  saveSnapshot,
  calculateSpi,
} from "@/lib/spotify";

const bodySchema = z.object({
  artistId: z.string().min(1, "artistId is required"),
});

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim();
  }
  return request.headers.get("x-real-ip") ?? "anon";
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`artist-sync:${ip}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ ok: false, error: "Too many sync attempts, please retry later." }, { status: 429 });
    }

    const payload = bodySchema.parse(await request.json());
    const artist = await recordArtistFromSpotify(payload.artistId);

    await saveSnapshot({
      artistId: artist.id,
      spotifyPopularity: artist.popularity ?? 0,
      spi: artist.spi ?? calculateSpi(artist.popularity ?? 0),
    });

    const tracks = await getArtistTopTracks(payload.artistId);
    let storedTracks = 0;
    for (const track of tracks) {
      try {
        const stored = await recordTrackFromSpotify(track.id, payload.artistId);
        await saveSnapshot({
          trackId: stored.id,
          spotifyPopularity: stored.popularity ?? 0,
          spi: stored.spi ?? calculateSpi(stored.popularity ?? 0),
        });
        storedTracks += 1;
      } catch (err) {
        console.error("[artist-sync] Failed to store track", track.id, err);
      }
    }

    return NextResponse.json({
      ok: true,
      artistId: artist.id,
      storedTracks,
    });
  } catch (error) {
    console.error("[artist-sync] Sync failed", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ ok: false, error: "Failed to sync artist" }, { status: 500 });
  }
}





