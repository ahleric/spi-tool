import { prisma } from "@/lib/prisma";
import {
  getPopularitySnapshotsForTrack,
  recordTrackFromSpotify,
  calculateSpi,
  getTrackById,
  saveSnapshot,
  topImage,
} from "@/lib/spotify";
import { ensureArtistRecord } from "@/lib/services/catalog";

export async function getTrackDetail(trackId: string) {
  try {
    let track = await prisma.track.findUnique({
      where: { id: trackId },
      include: { artist: true },
    });

    if (!track) {
      const recorded = await recordTrackFromSpotify(trackId);
      track = await prisma.track.findUnique({
        where: { id: recorded.id },
        include: { artist: true },
      });
    }

    if (!track) {
      return null;
    }

    // Parallel: ensure artist exists and fetch snapshots (optimize for speed)
    const snapshotsPromise = getPopularitySnapshotsForTrack(trackId, 120);
    const artistPromise = track.artistId
      ? ensureArtistRecord(track.artistId).catch(() => null)
      : Promise.resolve(null);

    const [_, snapshots] = await Promise.all([artistPromise, snapshotsPromise]);

    // If today's snapshot is missing, create one (async, don't block)
    const hasTodaySnapshot = snapshots.some((s) => isSameUtcDay(new Date(s.capturedAt), new Date()));
    if (!hasTodaySnapshot && track.popularity !== null) {
      saveSnapshot({
        trackId: track.id,
        spotifyPopularity: track.popularity,
        spi: track.spi ?? calculateSpi(track.popularity),
      }).catch(() => {
        // Silently fail
      });
    }

    return {
      track,
      artist: track.artist ?? null,
      stats: {
        popularity: track.popularity ?? 0,
        spi: track.spi ?? calculateSpi(track.popularity ?? 0),
        durationMs: track.durationMs ?? 0,
      },
      snapshots,
    };
  } catch (err) {
    // Graceful degradation: if DB is unavailable, fetch directly from Spotify
    const t = await getTrackById(trackId);
    return {
      track: {
        id: t.id,
        name: t.name,
        artistId: t.artists?.[0]?.id ?? "",
        album: t.album?.name,
        imageUrl: topImage(t.album?.images),
        previewUrl: undefined,
        spotifyUrl: `https://open.spotify.com/track/${t.id}`,
        durationMs: (t as any).duration_ms ?? 0,
        popularity: t.popularity ?? 0,
        spi: calculateSpi(t.popularity ?? 0),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any,
      artist: null,
      stats: {
        popularity: t.popularity ?? 0,
        spi: calculateSpi(t.popularity ?? 0),
        durationMs: (t as any).duration_ms ?? 0,
      },
      snapshots: [],
    };
  }
}

function isSameUtcDay(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}
