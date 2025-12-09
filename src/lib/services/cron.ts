import { prisma } from "@/lib/prisma";
import { refreshSnapshotsForArtist, refreshSnapshotsForTrack } from "@/lib/spotify";

const CRON_LOCK_TTL_MS = 30 * 60 * 1000; // 30 minutes
const TRACK_SNAPSHOT_LIMIT = 150; // cap per run to avoid rate limits
const TRACK_EVENT_LOOKBACK_DAYS = 90;

/**
 * Acquire a simple lock using EventLog to prevent concurrent cron execution
 */
async function acquireLock(): Promise<boolean> {
  try {
    // Check if there's an active lock (created within last 30 minutes)
    const lockCutoff = new Date(Date.now() - CRON_LOCK_TTL_MS);
    const existingLock = await prisma.eventLog.findFirst({
      where: {
        type: "cron_lock",
        createdAt: { gte: lockCutoff },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingLock) {
      return false; // Lock already exists
    }

    // Create lock
    await prisma.eventLog.create({
      data: {
        type: "cron_lock",
        input: `lock_${Date.now()}`,
      },
    });

    return true;
  } catch (err) {
    console.error("Failed to acquire lock:", err);
    return false;
  }
}

/**
 * Release lock by creating an unlock event
 */
async function releaseLock() {
  try {
    await prisma.eventLog.create({
      data: {
        type: "cron_unlock",
        input: `unlock_${Date.now()}`,
      },
    });
  } catch (err) {
    console.error("Failed to release lock:", err);
  }
}

/**
 * Log cron execution summary to EventLog
 */
async function logCronExecution(summary: {
  processed: number;
  success: number;
  failed: number;
  durationMs: number;
  trackProcessed?: number;
  trackSuccess?: number;
  trackFailed?: number;
  error?: string;
}) {
  try {
    await prisma.eventLog.create({
      data: {
        type: "cron_execution",
        input: JSON.stringify(summary),
      },
    });
  } catch (err) {
    console.error("Failed to log cron execution:", err);
  }
}

export async function runSnapshotCron() {
  const startTime = Date.now();

  // Try to acquire lock
  const hasLock = await acquireLock();
  if (!hasLock) {
    const error = "Another cron job is already running or recently completed";
    await logCronExecution({
      processed: 0,
      success: 0,
      failed: 0,
      durationMs: Date.now() - startTime,
      error,
    });
    throw new Error(error);
  }

  try {
    // First, process any queued ingest requests (from first-time views)
    const requests = await prisma.eventLog.findMany({
      where: { type: "ingest_request" },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    const requestedArtistIds = Array.from(new Set(requests.map((r) => r.artistId).filter(Boolean) as string[]));

    // Then, process the rest of artists as a fallback sweep
    const artists = await prisma.artist.findMany({
      select: { id: true },
      orderBy: { updatedAt: "asc" },
    });

    const results: string[] = [];
    const errors: Array<{ artistId: string; error: string }> = [];

    // Process requested artists first
    const queue = [
      ...requestedArtistIds.map((id) => ({ id })),
      ...artists.filter((a) => !requestedArtistIds.includes(a.id)),
    ];

    for (const artist of queue) {
      try {
        await refreshSnapshotsForArtist(artist.id);
        results.push(artist.id);
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        errors.push({ artistId: artist.id, error });
        console.error(`Failed to process artist ${artist.id}:`, error);
      }
    }

    // Cleanup processed ingest requests
    if (requestedArtistIds.length) {
      await prisma.eventLog.deleteMany({ where: { type: "ingest_request", artistId: { in: requestedArtistIds } } }).catch(() => {/* noop */});
    }

    // Process track snapshots for tracks that have been viewed recently
    const trackWindow = new Date(Date.now() - TRACK_EVENT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const trackEvents = await prisma.eventLog.findMany({
      where: {
        trackId: { not: null },
        type: { in: ["track_view", "track_open"] },
        createdAt: { gte: trackWindow },
      },
      select: { trackId: true },
      orderBy: { createdAt: "desc" },
      take: TRACK_SNAPSHOT_LIMIT * 3, // fetch extra, we'll dedupe below
    });
    const trackIds = Array.from(
      new Set(
        trackEvents
          .map((t) => t.trackId)
          .filter((id): id is string => Boolean(id)),
      ),
    ).slice(0, TRACK_SNAPSHOT_LIMIT);

    const trackResults: string[] = [];
    const trackErrors: Array<{ trackId: string; error: string }> = [];

    for (const trackId of trackIds) {
      try {
        await refreshSnapshotsForTrack(trackId);
        trackResults.push(trackId);
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        trackErrors.push({ trackId, error });
        console.error(`Failed to process track ${trackId}:`, error);
      }
    }

    const durationMs = Date.now() - startTime;
    const summary = {
      processed: artists.length,
      success: results.length,
      failed: errors.length,
      durationMs,
      trackProcessed: trackIds.length,
      trackSuccess: trackResults.length,
      trackFailed: trackErrors.length,
      error: errors.length > 0 ? `${errors.length} artists failed` : undefined,
    };

    // Log execution summary
    await logCronExecution(summary);

    return {
      processed: results.length,
      artistIds: results,
      errors: errors.length > 0 ? errors : undefined,
      durationMs,
    };
  } finally {
    // Always release lock
    await releaseLock();
  }
}
