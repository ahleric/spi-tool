import { prisma } from "@/lib/prisma";
import { getTracksByIds, getAlbumsByIds, mapTrackMeta } from "@/lib/spotify";

const DEFAULT_BATCH = 100;
const INTER_BATCH_DELAY_MS = 400;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Drip backfill of Spotify metadata (explicit / releaseDate / albumType / label / copyright)
 * for existing tracks that were ingested before these fields existed.
 *
 * Rate-limit safe by design:
 *  - processes at most `batchSize` tracks per invocation (bounded);
 *  - uses batch endpoints (50 tracks / 20 albums per request) + album de-dup, so a
 *    batch of 100 tracks is only a handful of requests;
 *  - relies on spotifyRequest's built-in 429 backoff + global backpressure;
 *  - idempotent & resumable via `metaSyncedAt` (never reprocesses a synced row).
 *
 * Call repeatedly (manually or on a schedule) until `done` is true.
 */
export async function backfillTrackMetadata({
  batchSize = DEFAULT_BATCH,
}: { batchSize?: number } = {}) {
  const pending = await prisma.track.findMany({
    where: { metaSyncedAt: null },
    orderBy: { updatedAt: "desc" }, // most recently touched (likely most viewed) first
    take: batchSize,
    select: { id: true },
  });

  if (!pending.length) {
    return { processed: 0, remaining: 0, done: true };
  }

  const ids = pending.map((t) => t.id);

  // 1) Batch-fetch the tracks (50 per request).
  const tracks = await getTracksByIds(ids);
  await sleep(INTER_BATCH_DELAY_MS);

  // 2) De-dup album ids and batch-fetch albums (20 per request) for label / copyright.
  const albumIds = Array.from(
    new Set(
      tracks
        .map((t) => t.album?.id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const albums = albumIds.length ? await getAlbumsByIds(albumIds) : [];
  const albumById = new Map(albums.map((a) => [a.id, a]));

  // 3) Write each track's metadata.
  const now = new Date();
  let processed = 0;
  for (const track of tracks) {
    const album = track.album?.id ? albumById.get(track.album.id) ?? null : null;
    const meta = mapTrackMeta(track, album);
    try {
      await prisma.track.update({
        where: { id: track.id },
        data: {
          explicit: meta.explicit,
          releaseDate: meta.releaseDate,
          albumType: meta.albumType,
          label: meta.label,
          copyright: meta.copyright,
          metaSyncedAt: now,
        },
      });
      processed += 1;
    } catch {
      // skip a single row that fails to update; it stays unsynced and retries next run
    }
  }

  // Tracks Spotify no longer returns (removed / unavailable): mark synced so the
  // backfill doesn't spin on them forever.
  const returned = new Set(tracks.map((t) => t.id));
  const missing = ids.filter((id) => !returned.has(id));
  if (missing.length) {
    await prisma.track
      .updateMany({ where: { id: { in: missing } }, data: { metaSyncedAt: now } })
      .catch(() => {});
  }

  const remaining = await prisma.track.count({ where: { metaSyncedAt: null } });
  return { processed, remaining, done: remaining === 0 };
}
