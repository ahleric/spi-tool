import { prisma } from "@/lib/prisma";
import { ensureArtistRecord } from "@/lib/services/catalog";
import {
  getPopularitySnapshotsForArtist,
  calculateSpi,
  getArtistById,
  getArtistTopTracks,
  topImage,
  recordTrackFromSpotify,
} from "@/lib/spotify";
import type { Artist } from "@prisma/client";

const artistSyncInFlight = new Set<string>();
const trackSyncInFlight = new Set<string>();
const artistSyncCooldown = new Map<string, number>();
const trackSyncCooldown = new Map<string, number>();
const SYNC_COOLDOWN_MS = 5 * 60 * 1000;

export async function getArtistDetail(params: {
  artistId: string;
  page?: number;
  pageSize?: number;
}) {
  const { artistId } = params;

  try {
    // First, try to get artist from DB (fast, no API call)
    const artist = await prisma.artist.findUnique({ where: { id: artistId } });
    
    // Fetch snapshots from DB (no API call)
    const snapshots = await getPopularitySnapshotsForArtist(artistId, 120).catch((err) => {
      console.error("[getArtistDetail] Error fetching snapshots:", err);
      return [];
    });
    
    let ensuredArtist: Artist | (Artist & { spotifyUrl?: string }) | null = artist;
    const wasCreated = !artist;
    let artistStored = !!artist;

    if (!ensuredArtist) {
      // Immediately return placeholder to avoid blocking SSR
      ensuredArtist = createPlaceholderArtist(artistId);
      artistStored = false;
      scheduleArtistSync(artistId);
    }

    // Smart caching: Only fetch top tracks from Spotify if:
    // 1. We don't have enough tracks in DB, OR
    // 2. The artist was just created (first time), OR
    // 3. The tracks in DB are older than 1 hour
    let topTracks: any[] = [];
    const dbTracks = await prisma.track.findMany({
      where: { artistId },
      take: 10,
      orderBy: { popularity: "desc" },
    }).catch(() => []);
    
    // Increase cache time to 6 hours for production (reduces API calls significantly)
    const CACHE_DURATION_MS = 6 * 60 * 60 * 1000; // 6 hours
    const shouldRefreshTracks =
      artistStored &&
      (wasCreated ||
        dbTracks.length < 5 ||
        (dbTracks[0]?.updatedAt &&
          new Date().getTime() - dbTracks[0].updatedAt.getTime() > CACHE_DURATION_MS));
    
    if (shouldRefreshTracks) {
      // Only call API if we need fresh data
      // Add timeout to avoid long waits on rate limits
      try {
        const tracksPromise = getArtistTopTracks(artistId);
        const tracksTimeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("Top tracks timeout")), 8000); // 8s timeout
        });
        
        topTracks = await Promise.race([tracksPromise, tracksTimeoutPromise]);
      } catch (err) {
        console.error("[getArtistDetail] Error fetching top tracks, using DB cache:", err);
        // Use DB tracks as fallback
        if (dbTracks.length > 0) {
          topTracks = dbTracks.map((t) => ({
            id: t.id,
            name: t.name,
            popularity: t.popularity ?? 0,
            artistId: t.artistId,
            artistName: ensuredArtist?.name ?? "",
            imageUrl: t.imageUrl ?? "",
            duration_ms: t.durationMs ?? 0,
            albumId: "",
            albumName: t.album ?? "",
          }));
        }
      }
    } else if (!artistStored && dbTracks.length === 0) {
      // No cached tracks yet; schedule a background sync
      scheduleTopTracksSync(artistId);
    } else {
      // Use cached tracks from DB (no API call)
      console.log(`[getArtistDetail] Using cached tracks from DB for artist ${artistId}`);
      topTracks = dbTracks.map((t) => ({
        id: t.id,
        name: t.name,
        popularity: t.popularity ?? 0,
        artistId: t.artistId,
        artistName: ensuredArtist?.name ?? "",
        imageUrl: t.imageUrl ?? "",
        duration_ms: t.durationMs ?? 0,
        albumId: "",
        albumName: t.album ?? "",
      }));
    }

    // If artist exists but has no imageUrl, refresh from Spotify (async, don't block)
    if (artistStored && ensuredArtist && !ensuredArtist.imageUrl) {
      getArtistById(artistId)
        .then((spotifyArtist) => {
          const imageUrl = topImage(spotifyArtist.images);
          if (imageUrl) {
            prisma.artist.update({
              where: { id: artistId },
              data: { imageUrl },
            });
          }
        })
        .catch(() => {
          // Silently fail, don't block the page
        });
    }

    // Save top tracks to database asynchronously (don't block page load)
    // Only save if we fetched fresh data from Spotify (not from cache)
    if (artistStored && shouldRefreshTracks && topTracks.length > 0) {
      Promise.all(
        topTracks.map((track) =>
          recordTrackFromSpotify(track.id, artistId).catch(() => {
            // Silently fail for individual tracks
          }),
        )
      ).catch(() => {
        // Silently fail
      });
    }

    // Determine indexing status without calling heavy Spotify track listing APIs
    const hasAnyTracks = topTracks.length > 0 || dbTracks.length > 0;
    const hasSnapshots = snapshots.length > 0;
    const isFirstIndexed = wasCreated && !hasSnapshots && !hasAnyTracks;
    const isComputing = !wasCreated && (!artistStored || (!hasSnapshots && !hasAnyTracks));

    // On first discovery, enqueue an ingest request for cron to process later
    if (artistStored && wasCreated) {
      prisma.eventLog
        .create({ data: { type: "ingest_request", artistId, input: "auto_first_view" } })
        .catch(() => {/* noop */});
    }

    // If no snapshots exist, create one from current popularity
    if (
      artistStored &&
      snapshots.length === 0 &&
      ensuredArtist?.popularity !== null &&
      ensuredArtist?.popularity !== undefined
    ) {
      // Create snapshot asynchronously (don't block page load)
      const { saveSnapshot } = await import("@/lib/spotify");
      saveSnapshot({
        artistId: ensuredArtist.id,
        spotifyPopularity: ensuredArtist.popularity,
        spi: ensuredArtist.spi ?? calculateSpi(ensuredArtist.popularity),
      }).catch(() => {
        // Silently fail
      });
    }

    // Convert UTrack to Track format for the table
    const tracks = topTracks.map((t) => ({
      id: t.id,
      name: t.name,
      artistId: t.artistId,
      album: t.albumName,
      previewUrl: undefined,
      spotifyUrl: `https://open.spotify.com/track/${t.id}`,
      durationMs: t.duration_ms,
      popularity: t.popularity,
      spi: calculateSpi(t.popularity),
      imageUrl: t.imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as any[];

    return {
      artist: ensuredArtist,
      stats: {
        followers: ensuredArtist?.followers ?? 0,
        popularity: ensuredArtist?.popularity ?? 0,
        spi: ensuredArtist?.spi ?? calculateSpi(ensuredArtist?.popularity ?? 0),
        isFirstIndexed,
        isComputing,
      },
      tracks,
      snapshots,
      pagination: {
        page: 1,
        pageSize: 10,
        total: topTracks.length, // 显示的是前10首
        totalPages: 1,
      },
    };
  } catch (err) {
    // Graceful fallback when DB is not reachable: fetch directly from Spotify
    const [artist, topTracks] = await Promise.all([
      getArtistById(artistId),
      getArtistTopTracks(artistId),
    ]);

    const tracks = topTracks.map((t) => ({
      id: t.id,
      name: t.name,
      artistId: t.artistId,
      album: t.albumName,
      previewUrl: undefined,
      spotifyUrl: `https://open.spotify.com/track/${t.id}`,
      durationMs: t.duration_ms,
      popularity: t.popularity,
      spi: calculateSpi(t.popularity),
      imageUrl: t.imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    })) as any[];

    return {
      artist: {
        id: artist.id,
        name: artist.name,
        imageUrl: topImage(artist.images),
        followers: artist.followers?.total ?? 0,
        popularity: artist.popularity ?? 0,
        spi: calculateSpi(artist.popularity ?? 0),
        genres: artist.genres ?? [],
      } as any,
      stats: {
        followers: artist.followers?.total ?? 0,
        popularity: artist.popularity ?? 0,
        spi: calculateSpi(artist.popularity ?? 0),
        isFirstIndexed: false,
        isComputing: false,
      },
      tracks,
      snapshots: [],
      pagination: {
        page: 1,
        pageSize: 10,
        total: topTracks.length,
        totalPages: 1,
      },
    };
  }
}

function createPlaceholderArtist(id: string): Artist {
  return {
    id,
    name: "Unknown Artist",
    imageUrl: null,
    followers: 0,
    popularity: 0,
    spi: 0,
    genres: [],
    spotifyUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Artist;
}

function scheduleArtistSync(artistId: string) {
  const now = Date.now();
  const cooldownUntil = artistSyncCooldown.get(artistId) ?? 0;
  if (artistSyncInFlight.has(artistId) || cooldownUntil > now) {
    return;
  }
  artistSyncInFlight.add(artistId);
  setTimeout(async () => {
    try {
      await ensureArtistRecord(artistId);
      console.log(`[artist-sync] Stored artist ${artistId}`);
      artistSyncCooldown.set(artistId, Date.now() + 60_000);
    } catch (err) {
      console.error(`[artist-sync] Artist sync failed for ${artistId}`, err);
      artistSyncCooldown.set(artistId, Date.now() + SYNC_COOLDOWN_MS);
    } finally {
      artistSyncInFlight.delete(artistId);
    }
  }, 0);
}

function scheduleTopTracksSync(artistId: string) {
  const now = Date.now();
  const cooldownUntil = trackSyncCooldown.get(artistId) ?? 0;
  if (trackSyncInFlight.has(artistId) || cooldownUntil > now) {
    return;
  }
  trackSyncInFlight.add(artistId);
  setTimeout(async () => {
    try {
      scheduleArtistSync(artistId);
      const tracks = await getArtistTopTracks(artistId);
      await Promise.all(
        tracks.map((track) =>
          recordTrackFromSpotify(track.id, artistId).catch(() => {
            // noop
          }),
        ),
      );
      console.log(`[track-sync] Stored top tracks for ${artistId}`);
      trackSyncCooldown.set(artistId, Date.now() + 60_000);
    } catch (err) {
      console.error(`[track-sync] Top tracks sync failed for ${artistId}`, err);
      trackSyncCooldown.set(artistId, Date.now() + SYNC_COOLDOWN_MS);
    } finally {
      trackSyncInFlight.delete(artistId);
    }
  }, 0);
}
