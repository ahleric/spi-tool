import { prisma } from "@/lib/prisma";
import {
  getArtistIdFromInput,
  recordArtistFromSpotify,
  recordTrackFromSpotify,
  refreshSnapshotsForArtist,
} from "@/lib/spotify";

export type SuggestionItem = {
  type: "artist" | "track" | "query";
  id?: string;
  name: string;
  subtitle?: string;
  source: "popular" | "match";
  count?: number;
};

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

function normalizeText(input: string | null | undefined) {
  return (input || "").trim().toLowerCase();
}

function makeKey(item: SuggestionItem) {
  const idPart = item.id ? item.id : normalizeText(item.name);
  return `${item.type}:${idPart}`;
}

export async function suggestCatalog(query: string, limit = 6): Promise<SuggestionItem[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  const normalized = trimmed.toLowerCase();
  const suggestions: SuggestionItem[] = [];
  const seen = new Set<string>();

  const pushSuggestion = (item: SuggestionItem) => {
    const key = makeKey(item);
    if (seen.has(key)) return;
    seen.add(key);
    suggestions.push(item);
  };

  const [artists, tracks] = await Promise.all([
    prisma.artist.findMany({
      where: { name: { contains: trimmed, mode: "insensitive" } },
      select: { id: true, name: true },
      take: Math.max(3, Math.ceil(limit / 2)),
    }),
    prisma.track.findMany({
      where: { name: { contains: trimmed, mode: "insensitive" } },
      select: { id: true, name: true, artist: { select: { name: true } } },
      take: Math.max(3, Math.ceil(limit / 2)),
    }),
  ]);

  artists.forEach((artist) => {
    pushSuggestion({
      type: "artist",
      id: artist.id,
      name: artist.name,
      source: "match",
    });
  });

  tracks.forEach((track) => {
    pushSuggestion({
      type: "track",
      id: track.id,
      name: track.name,
      subtitle: track.artist?.name,
      source: "match",
    });
  });

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentEvents = await prisma.eventLog.findMany({
    where: { type: "search", createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 400,
    select: {
      artistId: true,
      artistName: true,
      trackId: true,
      trackName: true,
      input: true,
    },
  });

  const popularMap = new Map<string, { item: SuggestionItem; count: number }>();

  const upsertPopular = (item: SuggestionItem) => {
    const key = makeKey(item);
    const existing = popularMap.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      popularMap.set(key, { item, count: 1 });
    }
  };

  recentEvents.forEach((event) => {
    const artistName = event.artistName?.trim();
    const trackName = event.trackName?.trim();
    const input = event.input?.trim();

    if (artistName && normalizeText(artistName).includes(normalized)) {
      upsertPopular({
        type: "artist",
        id: event.artistId ?? undefined,
        name: artistName,
        source: "popular",
      });
      return;
    }

    if (trackName && normalizeText(trackName).includes(normalized)) {
      upsertPopular({
        type: "track",
        id: event.trackId ?? undefined,
        name: trackName,
        source: "popular",
      });
      return;
    }

    if (input && normalizeText(input).includes(normalized)) {
      upsertPopular({
        type: "query",
        name: input,
        source: "popular",
      });
    }
  });

  const popularSorted = Array.from(popularMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.max(2, Math.floor(limit / 2)));

  popularSorted.forEach(({ item, count }) => {
    pushSuggestion({ ...item, count });
  });

  return suggestions.slice(0, limit);
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
