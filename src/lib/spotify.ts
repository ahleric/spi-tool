import axios, { AxiosRequestConfig } from "axios";
import { prisma } from "@/lib/prisma";

const SPOTIFY_ACCOUNTS_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE_URL = "https://api.spotify.com/v1";

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;
let rateLimitResetAt = 0; // epoch ms until which we should back off

// Request deduplication: track in-flight requests to avoid duplicate API calls
const inFlightRequests = new Map<string, Promise<any>>();

type SpotifyArtist = {
  id: string;
  name: string;
  popularity: number;
  followers: { total: number };
  images: { url: string; width?: number; height?: number }[];
  genres: string[];
  external_urls?: { spotify?: string };
};

type SpotifyTrack = {
  id: string;
  name: string;
  popularity: number;
  preview_url: string | null;
  duration_ms: number;
  external_urls?: { spotify?: string };
  album: { name: string; images: { url: string; width?: number; height?: number }[] };
  artists: { id: string; name: string }[];
};

type SpotifySearchResponse = {
  artists?: { items: SpotifyArtist[] };
  tracks?: { items: SpotifyTrack[] };
};

export type SpotifyLookupResult =
  | { type: "artist"; id: string; url?: string }
  | { type: "track"; id: string; url?: string };

const spotifyUrlPattern =
  /open\.spotify\.com\/(?<type>artist|track)\/(?<id>[a-zA-Z0-9]+)/;
const spotifyUriPattern =
  /spotify:(?<type>artist|track):(?<id>[a-zA-Z0-9]+)/;

const ensureEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export async function getSpotifyAppToken(forceRefresh = false) {
  if (!forceRefresh && tokenCache && tokenCache.expiresAt > Date.now()) {
    return tokenCache.accessToken;
  }

  const clientId = ensureEnv("SPOTIFY_CLIENT_ID");
  const clientSecret = ensureEnv("SPOTIFY_CLIENT_SECRET");

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const body = new URLSearchParams({
    grant_type: "client_credentials",
  });

  const response = await axios.post<{ access_token: string; expires_in: number }>(
    SPOTIFY_ACCOUNTS_URL,
    body.toString(),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  tokenCache = {
    accessToken: response.data.access_token,
    expiresAt: Date.now() + response.data.expires_in * 1000 - 60 * 1000,
  };

  return tokenCache.accessToken;
}

/** 
 * Legacy auth function for compatibility.
 * Returns headers object with Authorization Bearer token.
 * @deprecated Use getSpotifyAppToken() or spotifyRequest() instead
 */
export async function auth(): Promise<{ Authorization: string }> {
  const token = await getSpotifyAppToken();
  return { Authorization: `Bearer ${token}` };
}

async function spotifyRequest<T>(
  path: string,
  config: AxiosRequestConfig = {},
  retry = true,
  attempt = 0,
): Promise<T> {
  // Create a unique key for this request (path + method + key params)
  const requestKey = `${config.method || "GET"}:${path}:${JSON.stringify(config.params || {})}`;
  
  // Check if this exact request is already in flight
  if (inFlightRequests.has(requestKey)) {
    console.log(`[spotifyRequest] Deduplicating request: ${requestKey}`);
    return inFlightRequests.get(requestKey) as Promise<T>;
  }
  
  // Create the request promise
  const requestPromise = (async () => {
    try {
      const token = await getSpotifyAppToken();
      const url = path.startsWith("http") ? path : `${SPOTIFY_API_BASE_URL}${path}`;

      // Honor global backoff window if we recently got 429
      if (rateLimitResetAt > Date.now()) {
        const waitMs = rateLimitResetAt - Date.now();
        if (waitMs > 0) {
          await new Promise((r) => setTimeout(r, waitMs));
        }
      }
      
      const response = await axios.request<T>({
        url,
        ...config,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(config.headers ?? {}),
        },
        timeout: config.timeout ?? 10000, // Increased to 10s to allow for slower responses
      });

      // Clear rate limit backoff on successful request
      if (rateLimitResetAt > 0) {
        rateLimitResetAt = 0;
      }

      return response.data;
    } catch (error: unknown) {
      if (
        retry &&
        axios.isAxiosError(error) &&
        error.response?.status === 401
      ) {
        await getSpotifyAppToken(true);
        return spotifyRequest<T>(path, config, false, attempt);
      }
      if (axios.isAxiosError(error)) {
        const status = error.response?.status ?? 0;
        
        // Handle 429 rate limit errors with more retries and better backoff
        if (status === 429) {
          const maxRetries = 5; // Increased retries for 429 errors
          if (attempt < maxRetries) {
            let delay = 2000 * (attempt + 1); // Linear backoff: 2s, 4s, 6s, 8s, 10s
            const retryAfter = error.response?.headers?.["retry-after"];
            if (retryAfter) {
              const sec = Number(retryAfter);
              if (!Number.isNaN(sec) && sec > 0) {
                    // Fully respect Retry-After header from Spotify, but cap at 30s for UX
                delay = Math.min(sec * 1000, 30000);
                console.log(`[spotifyRequest] Rate limited, waiting ${delay/1000}s as per Retry-After header`);
              }
            }
            // Cap delay at 30 seconds for better UX (Spotify's Retry-After can be up to 60s, but we cap it)
            // For critical paths, this prevents extremely long waits
            delay = Math.min(delay, 30000);
            rateLimitResetAt = Date.now() + delay;
            console.log(`[spotifyRequest] Rate limit hit, waiting ${delay/1000}s before retry (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise((r) => setTimeout(r, delay));
            return spotifyRequest<T>(path, config, retry, attempt + 1);
          }
          // After max retries, throw a more descriptive error
          throw new Error(`Spotify API rate limit exceeded. Please try again in a few moments.`);
        }
        
        // Handle 5xx server errors with fewer retries
        if (status >= 500 && attempt < 3) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // 1s, 2s, 4s max
          await new Promise((r) => setTimeout(r, delay));
          return spotifyRequest<T>(path, config, retry, attempt + 1);
        }
      }
      throw error;
    } finally {
      // Remove from in-flight requests when done
      inFlightRequests.delete(requestKey);
    }
  })();
  
  // Store the promise for deduplication
  inFlightRequests.set(requestKey, requestPromise);
  
  return requestPromise;
}

export async function getArtistById(artistId: string) {
  const data = await spotifyRequest<SpotifyArtist>(`/artists/${artistId}`);
  return data;
}

export async function getTrackById(trackId: string) {
  const data = await spotifyRequest<SpotifyTrack>(`/tracks/${trackId}`);
  return data;
}

export async function getArtistIdFromInput(
  input: string,
): Promise<SpotifyLookupResult | null> {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(spotifyUrlPattern);
  if (urlMatch?.groups) {
    const type = urlMatch.groups.type as "artist" | "track";
    return {
      type,
      id: urlMatch.groups.id,
      url: trimmed,
    };
  }

  const uriMatch = trimmed.match(spotifyUriPattern);
  if (uriMatch?.groups) {
    const type = uriMatch.groups.type as "artist" | "track";
    return {
      type,
      id: uriMatch.groups.id,
      url: `https://open.spotify.com/${type}/${uriMatch.groups.id}`,
    };
  }

  // Fast local DB lookup by name first (avoids remote calls when rate-limited)
  try {
    if (trimmed.length >= 2) {
      const localArtist = await prisma.artist.findFirst({
        where: { name: { contains: trimmed, mode: "insensitive" } },
        select: { id: true },
      });
      if (localArtist) {
        return { type: "artist", id: localArtist.id };
      }
      
      // Also check tracks in local DB
      const localTrack = await prisma.track.findFirst({
        where: { name: { contains: trimmed, mode: "insensitive" } },
        select: { id: true, artistId: true },
      });
      if (localTrack) {
        return { type: "track", id: localTrack.id };
      }
    }
  } catch {}

  try {
    const searchResult = await spotifyRequest<SpotifySearchResponse>(
      `/search?${new URLSearchParams({
        q: trimmed,
        type: "artist,track",
        limit: "1",
        market: "US",
      }).toString()}`,
    );

    const artistFallback = searchResult.artists?.items?.[0];
    if (artistFallback) {
      return {
        type: "artist",
        id: artistFallback.id,
        url: artistFallback.external_urls?.spotify,
      };
    }

    const trackFallback = searchResult.tracks?.items?.[0];
    if (trackFallback) {
      return {
        type: "track",
        id: trackFallback.id,
        url: trackFallback.external_urls?.spotify,
      };
    }
  } catch (err) {
    // Graceful fallback on rate limit or network error: try local DB by name
    const isRateLimitError = err instanceof Error && 
      (err.message.includes("rate limit") || err.message.includes("429"));
    
    if (isRateLimitError || axios.isAxiosError(err)) {
      try {
        // Try to find in local database as fallback
        const foundArtists = await prisma.artist.findMany({
          where: { name: { contains: trimmed, mode: "insensitive" } },
          take: 1,
          select: { id: true },
        });
        if (foundArtists[0]) {
          return { type: "artist", id: foundArtists[0].id };
        }
        
        const foundTracks = await prisma.track.findMany({
          where: { name: { contains: trimmed, mode: "insensitive" } },
          take: 1,
          select: { id: true },
        });
        if (foundTracks[0]) {
          return { type: "track", id: foundTracks[0].id };
        }
      } catch (dbErr) {
        // If DB lookup also fails, continue to return null
      }
    }
    
    // Re-throw if it's not a rate limit error, so caller can handle it
    if (!isRateLimitError) {
      throw err;
    }
    
    return null;
  }

  return null;
}

export async function getArtistTracksAll(artistId: string) {
  const albums = await fetchArtistAlbums(artistId);
  const albumIds = Array.from(new Set(albums.map((album) => album.id)));
  const tracks: SpotifyTrack[] = [];

  for (let i = 0; i < albumIds.length; i += 5) {
    const chunk = albumIds.slice(i, i + 5);
    const albumResponses = await Promise.all(
      chunk.map((albumId) =>
        spotifyRequest<{ items: any[] }>(
          `/albums/${albumId}/tracks?limit=50&market=US`,
        ),
      ),
    );

    albumResponses.forEach((album, idx) => {
      (album.items ?? []).forEach((track: any) => {
        if (
          track?.artists?.some((artist: any) => artist.id === artistId) &&
          !tracks.find((existing) => existing.id === track.id)
        ) {
          tracks.push(track as SpotifyTrack);
        }
      });
    });

    // Continue fetching all tracks (removed 200 limit for accurate count)
    // Note: This may be slow for artists with many albums, but ensures accurate total count
  }

  return tracks;
}

async function fetchArtistAlbums(artistId: string) {
  let nextUrl: string | null = `/artists/${artistId}/albums?include_groups=album,single,compilation,appears_on&limit=50&market=US`;
  const albums: { id: string }[] = [];

  while (nextUrl) {
    const response: {
      items: { id: string }[];
      next: string | null;
    } = await spotifyRequest<{
      items: { id: string }[];
      next: string | null;
    }>(nextUrl);
    albums.push(...response.items);
    nextUrl = response.next;
  }

  return albums;
}

export async function getPopularitySnapshotsForArtist(
  artistId: string,
  limit = 90,
) {
  const snapshots = await prisma.artistPopularitySnapshot.findMany({
    where: { artistId },
    orderBy: { takenAt: "asc" },
    take: limit,
  });
  return snapshots.map((s) => ({
    capturedAt: s.takenAt,
    spotifyPopularity: s.popularity,
    spi: calculateSpi(s.popularity),
  }));
}

export async function getPopularitySnapshotsForTrack(
  trackId: string,
  limit = 90,
) {
  const snapshots = await prisma.trackPopularitySnapshot.findMany({
    where: { trackId },
    orderBy: { takenAt: "asc" },
    take: limit,
  });
  return snapshots.map((s) => ({
    capturedAt: s.takenAt,
    spotifyPopularity: s.popularity,
    spi: calculateSpi(s.popularity),
  }));
}

export async function saveSnapshot(params: {
  artistId?: string;
  trackId?: string;
  spotifyPopularity: number;
  spi: number;
}) {
  // De-dupe to at most one snapshot per entity per UTC day (application-layer)
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
  const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

  if (params.artistId) {
    const existing = await prisma.artistPopularitySnapshot.findFirst({
      where: {
        artistId: params.artistId,
        takenAt: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { takenAt: "desc" },
      select: { id: true },
    });
    if (existing) {
      await prisma.artistPopularitySnapshot.update({
        where: { id: existing.id },
        data: { popularity: params.spotifyPopularity },
      });
    } else {
      await prisma.artistPopularitySnapshot.create({
        data: {
          artistId: params.artistId,
          popularity: params.spotifyPopularity,
        },
      });
    }
  } else if (params.trackId) {
    const existing = await prisma.trackPopularitySnapshot.findFirst({
      where: {
        trackId: params.trackId,
        takenAt: { gte: startOfDay, lte: endOfDay },
      },
      orderBy: { takenAt: "desc" },
      select: { id: true },
    });
    if (existing) {
      await prisma.trackPopularitySnapshot.update({
        where: { id: existing.id },
        data: { popularity: params.spotifyPopularity },
      });
    } else {
      await prisma.trackPopularitySnapshot.create({
        data: {
          trackId: params.trackId,
          popularity: params.spotifyPopularity,
        },
      });
    }
  } else {
    throw new Error("Either artistId or trackId is required.");
  }
}

export function calculateSpi(popularity: number) {
  return Math.round((popularity / 100) * 1000) / 10;
}

/** 获取最高分辨率的图片URL */
export function topImage(images?: { url: string; width?: number; height?: number }[]): string | undefined {
  if (!images || !images.length) return undefined;
  // 取分辨率最高的（按width排序）
  return [...images].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url;
}

/** Top 10 tracks for an artist (using Spotify's top-tracks endpoint) */
export type UTrack = {
  id: string;
  name: string;
  popularity: number; // used as SPI
  artistId: string;
  artistName: string;
  imageUrl: string;
  duration_ms: number;
  albumId: string;
  albumName: string;
};

export async function getArtistTopTracks(artistId: string): Promise<UTrack[]> {
  const data = await spotifyRequest<{ tracks: any[] }>(
    `/artists/${artistId}/top-tracks?market=US`
  );

  const tracks = (data.tracks ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    popularity: t.popularity ?? 0,
    artistId: t.artists?.[0]?.id ?? "",
    artistName: t.artists?.[0]?.name ?? "",
    imageUrl: topImage(t.album?.images) ?? "",
    duration_ms: t.duration_ms ?? 0,
    albumId: t.album?.id ?? "",
    albumName: t.album?.name ?? "",
  }));

  tracks.sort((a, b) => b.popularity - a.popularity);
  return tracks.slice(0, 10);
}

export async function recordArtistFromSpotify(artistId: string) {
  const artist = await getArtistById(artistId);
  const imageUrl = topImage(artist.images);
  return prisma.artist.upsert({
    where: { id: artist.id },
    create: {
      id: artist.id,
      name: artist.name,
      genres: artist.genres,
      followers: artist.followers?.total ?? 0,
      popularity: artist.popularity,
      spi: calculateSpi(artist.popularity),
      imageUrl,
      spotifyUrl: artist.external_urls?.spotify,
    },
    update: {
      name: artist.name,
      genres: artist.genres,
      followers: artist.followers?.total ?? 0,
      popularity: artist.popularity,
      spi: calculateSpi(artist.popularity),
      imageUrl,
      spotifyUrl: artist.external_urls?.spotify,
      updatedAt: new Date(),
    },
  });
}

export async function recordTrackFromSpotify(trackId: string, artistId?: string) {
  const track = await getTrackById(trackId);
  const owningArtistId = artistId ?? track.artists?.[0]?.id;
  const imageUrl = topImage(track.album?.images);

  return prisma.track.upsert({
    where: { id: track.id },
    create: {
      id: track.id,
      name: track.name,
      artistId: owningArtistId,
      album: track.album?.name,
      imageUrl,
      previewUrl: track.preview_url,
      spotifyUrl: track.external_urls?.spotify,
      durationMs: track.duration_ms,
      popularity: track.popularity,
      spi: calculateSpi(track.popularity),
    },
    update: {
      name: track.name,
      artistId: owningArtistId,
      album: track.album?.name,
      imageUrl,
      previewUrl: track.preview_url,
      spotifyUrl: track.external_urls?.spotify,
      durationMs: track.duration_ms,
      popularity: track.popularity,
      spi: calculateSpi(track.popularity),
      updatedAt: new Date(),
    },
  });
}

export async function refreshSnapshotsForArtist(artistId: string) {
  const artist = await recordArtistFromSpotify(artistId);
  await saveSnapshot({
    artistId: artist.id,
    spotifyPopularity: artist.popularity ?? 0,
    spi: artist.spi ?? calculateSpi(artist.popularity ?? 0),
  });
}

export async function refreshSnapshotsForTrack(trackId: string) {
  const track = await recordTrackFromSpotify(trackId);
  await saveSnapshot({
    trackId: track.id,
    spotifyPopularity: track.popularity ?? 0,
    spi: track.spi ?? calculateSpi(track.popularity ?? 0),
  });
}
