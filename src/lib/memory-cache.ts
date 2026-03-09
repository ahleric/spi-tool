import { getSharedJson, setSharedJson } from "@/lib/shared-kv";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<any>>();
const MAX_CACHE_ENTRIES = 2000;
const CLEANUP_INTERVAL_MS = 30_000;
let lastCleanupAt = 0;

function getSharedCacheKey(key: string) {
  return `cache:v1:${key}`;
}

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

export async function getCache<T>(key: string): Promise<T | null> {
  const now = Date.now();
  cleanupIfNeeded(now);

  const entry = cache.get(key);
  if (entry) {
    if (entry.expiresAt <= now) {
      cache.delete(key);
    } else {
      return entry.value as T;
    }
  }

  const sharedEntry = await getSharedJson<CacheEntry<T>>(getSharedCacheKey(key));
  if (!sharedEntry || sharedEntry.expiresAt <= now) {
    return null;
  }

  cache.set(key, sharedEntry);
  enforceSizeLimit();
  return sharedEntry.value;
}

export async function setCache<T>(key: string, value: T, ttlMs: number) {
  const now = Date.now();
  cleanupIfNeeded(now);
  const entry = { value, expiresAt: now + ttlMs };
  cache.set(key, entry);
  enforceSizeLimit();
  await setSharedJson(getSharedCacheKey(key), entry, ttlMs);
}
