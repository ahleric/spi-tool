import { prisma } from "@/lib/prisma";
import {
  getArtistIdFromInput,
  recordArtistFromSpotify,
  recordTrackFromSpotify,
  refreshSnapshotsForArtist,
} from "@/lib/spotify";

export async function searchCatalog(query: string) {
  const lookup = await getArtistIdFromInput(query);
  if (!lookup) {
    return null;
  }

  try {
    if (lookup.type === "artist") {
      const artist = await ensureArtistRecord(lookup.id);
      return {
        type: "artist" as const,
        id: artist.id,
        name: artist.name,
        spi: artist.spi,
        popularity: artist.popularity,
        followers: artist.followers,
      };
    }

    const track = await recordTrackFromSpotify(lookup.id);
    if (track.artistId) {
      await ensureArtistRecord(track.artistId);
    }

    return {
      type: "track" as const,
      id: track.id,
      name: track.name,
      spi: track.spi,
      popularity: track.popularity,
      artistId: track.artistId,
    };
  } catch {
    // Graceful fallback: DB unavailable; still allow navigation by ID
    if (lookup.type === "artist") {
      return { type: "artist" as const, id: lookup.id } as any;
    }
    return { type: "track" as const, id: lookup.id } as any;
  }
}

export async function ensureArtistRecord(artistId: string) {
  const existing = await prisma.artist.findUnique({
    where: { id: artistId },
  });

  if (existing) {
    return existing;
  }

  // For new artists, use recordArtistFromSpotify with timeout protection
  // This avoids long waits if rate limited
  try {
    const recordPromise = recordArtistFromSpotify(artistId);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Record artist timeout")), 10000); // 10s timeout
    });
    
    return await Promise.race([recordPromise, timeoutPromise]);
  } catch (err) {
    // If recordArtistFromSpotify fails or times out, throw to let caller handle fallback
    throw err;
  }
}

export async function refreshArtistAndTracks(artistId: string) {
  await refreshSnapshotsForArtist(artistId);
}

export async function getBrandStats() {
  const [artists, tracks, artistSnapshots, trackSnapshots, events] = await Promise.all([
    prisma.artist.count(),
    prisma.track.count(),
    prisma.artistPopularitySnapshot.count(),
    prisma.trackPopularitySnapshot.count(),
    prisma.eventLog.count(),
  ]);

  return {
    artists,
    tracks,
    snapshots: artistSnapshots + trackSnapshots,
    events,
  };
}
