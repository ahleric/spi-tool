import { prisma } from "@/lib/prisma";

export type EventFilters = {
  type?: string;
  from?: Date;
  to?: Date;
  artistId?: string;
  trackId?: string;
};

export async function recordEvent(input: {
  type: string;
  artistId?: string;
  artistName?: string;
  trackId?: string;
  trackName?: string;
  input?: string;
  userAgent?: string;
  ip?: string;
}) {
  // Lightweight deduplication to avoid accidental double-logging
  // (e.g. double clicks or React hydration quirks)
  const now = Date.now();
  const recentWindowMs = 5_000;
  const since = new Date(now - recentWindowMs);

  const existing = await prisma.eventLog.findFirst({
    where: {
      type: input.type,
      artistId: input.artistId ?? null,
      trackId: input.trackId ?? null,
      input: input.input ?? null,
      userAgent: input.userAgent ?? null,
      ip: input.ip ?? null,
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return existing;
  }

  return prisma.eventLog.create({
    data: {
      type: input.type,
      artistId: input.artistId,
      artistName: input.artistName,
      trackId: input.trackId,
      trackName: input.trackName,
      input: input.input,
      userAgent: input.userAgent,
      ip: input.ip,
    },
  });
}

export async function getEvents(params: {
  page?: number;
  pageSize?: number;
  filters?: EventFilters;
}) {
  const { page = 1, pageSize = 20, filters } = params;
  const where = buildWhere(filters);
  const skip = (page - 1) * pageSize;

  const [events, total] = await Promise.all([
    prisma.eventLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.eventLog.count({ where }),
  ]);

  return {
    events,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    },
  };
}

export async function getEventMetrics(filters?: EventFilters) {
  const where = buildWhere(filters);
  const [eventsByType, recentEvents, topArtists] = await Promise.all([
    prisma.eventLog.groupBy({
      by: ["type"],
      _count: { _all: true },
      where,
    }),
    prisma.eventLog.findMany({
      where: {
        ...where,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.eventLog.groupBy({
      by: ["artistId", "artistName"],
      _count: { _all: true },
      where: {
        ...where,
        artistId: { not: null },
      },
      orderBy: { _count: { artistId: "desc" } },
      take: 10,
    }),
  ]);

  const timeline = recentEvents.reduce<Record<string, number>>((acc, event) => {
    const key = event.createdAt.toISOString().slice(0, 10);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return {
    byType: eventsByType.map((row) => ({
      type: row.type,
      count: row._count._all,
    })),
    timeline,
    topArtists: topArtists
      .filter((row) => row.artistName)
      .map((row) => ({
        artistId: row.artistId || "",
        artistName: row.artistName || "",
        count: row._count._all,
      })),
  };
}

function buildWhere(filters?: EventFilters) {
  if (!filters) {
    return {};
  }

  const where: any = {};

  if (filters.type) {
    where.type = filters.type;
  }

  if (filters.artistId) {
    where.artistId = filters.artistId;
  }

  if (filters.trackId) {
    where.trackId = filters.trackId;
  }

  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) {
      where.createdAt.gte = filters.from;
    }
    if (filters.to) {
      where.createdAt.lte = filters.to;
    }
  }

  return where;
}

export async function getInterestScores(params?: { days?: number; limit?: number; genreKeywords?: string[] }) {
  const days = params?.days ?? 30;
  const limit = params?.limit ?? 15;
  const genreKeywords = (params?.genreKeywords && params.genreKeywords.length)
    ? params.genreKeywords.map((s) => s.toLowerCase())
    : ["chinese", "mandarin", "mandopop", "c-pop", "indie", "rock"];

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const events = await prisma.eventLog.findMany({
    where: { createdAt: { gte: since }, artistId: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { type: true, artistId: true, artistName: true, createdAt: true },
  });

  const byArtist = new Map<string, { name: string; counts: Record<string, number>; lastAt: Date }>();
  for (const e of events) {
    const id = e.artistId as string;
    if (!byArtist.has(id)) {
      byArtist.set(id, { name: e.artistName || id, counts: {}, lastAt: e.createdAt });
    }
    const item = byArtist.get(id)!;
    item.counts[e.type] = (item.counts[e.type] ?? 0) + 1;
    if (e.createdAt > item.lastAt) item.lastAt = e.createdAt;
  }

  const artistIds = Array.from(byArtist.keys());
  const artists = await prisma.artist.findMany({ where: { id: { in: artistIds } }, select: { id: true, name: true, genres: true } });
  const genresMap = new Map(artists.map((a) => [a.id, (a.genres || []).map((g) => g.toLowerCase())]));

  const scored = artistIds.map((id) => {
    const agg = byArtist.get(id)!;
    const c = (k: string) => agg.counts[k] ?? 0;
    const search = c("search");
    const artistView = c("artist_view");
    const trackView = c("track_view");
    const trackOpen = c("track_open");
    const total = search + artistView + trackView + trackOpen;

    // Conversion rates with minimum sample thresholds to avoid noise from very small counts
    const MIN_SEARCH = 5;
    const MIN_ARTIST_VIEW = 5;
    const MIN_TRACK_VIEW = 5;

    const conv1 =
      search >= MIN_SEARCH ? artistView / search : 0; // search -> artist
    const conv2 =
      artistView >= MIN_ARTIST_VIEW ? trackView / artistView : 0; // artist -> track
    const conv3 =
      trackView >= MIN_TRACK_VIEW ? trackOpen / trackView : 0; // track -> open

    const recencyDays = Math.max(0, (Date.now() - agg.lastAt.getTime()) / (24 * 60 * 60 * 1000));
    const recencyScore = Math.max(0, 1 - recencyDays / days); // closer to 1 if very recent

    const g = genresMap.get(id) || [];
    const hasCn = g.some((x) => genreKeywords.slice(0, 4).some((kw) => x.includes(kw))); // first 4 are CN-related
    const hasIndieRock = g.some((x) => ["indie", "rock"].some((kw) => x.includes(kw)));
    const genreScore =
      hasCn && hasIndieRock ? 1 : hasCn || hasIndieRock ? 0.5 : 0;

    // Use log1p to compress large event counts so mid-tier artists are more visible
    const wSearch = Math.log1p(search);
    const wArtistView = Math.log1p(artistView);
    const wTrackView = Math.log1p(trackView);
    const wTrackOpen = Math.log1p(trackOpen);

    // Weighted sum scaled to 100
    const raw =
      wSearch * 1 +
      wArtistView * 3 +
      wTrackView * 4 +
      wTrackOpen * 5 +
      conv1 * 10 +
      conv2 * 12 +
      conv3 * 15 +
      recencyScore * 10 +
      genreScore * 10;
    const score = Math.round(Math.min(100, raw));

    return {
      artistId: id,
      artistName: artists.find((a) => a.id === id)?.name || agg.name,
      score,
      metrics: { search, artistView, trackView, trackOpen, total, conv1, conv2, conv3, recencyScore, genreScore },
      genres: g,
      lastAt: agg.lastAt,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}
