type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<any>>();
const MAX_CACHE_ENTRIES = 2000;
const CLEANUP_INTERVAL_MS = 30_000;
let lastCleanupAt = 0;

function cleanupExpired(now: number) {
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    }
  }
}

function cleanupIfNeeded(now: number) {
  if (now - lastCleanupAt < CLEANUP_INTERVAL_MS) {
    return;
  }
  cleanupExpired(now);
  lastCleanupAt = now;
}

function enforceSizeLimit() {
  while (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value as string | undefined;
    if (!oldestKey) {
      break;
    }
    cache.delete(oldestKey);
  }
}

export function getCache<T>(key: string): T | null {
  const now = Date.now();
  cleanupIfNeeded(now);

  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCache<T>(key: string, value: T, ttlMs: number) {
  const now = Date.now();
  cleanupIfNeeded(now);
  cache.set(key, { value, expiresAt: now + ttlMs });
  enforceSizeLimit();
}
