type Counter = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Counter>();
const MAX_RATE_LIMIT_KEYS = 10_000;
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanupAt = 0;

function cleanupExpired(now: number) {
  for (const [key, counter] of store.entries()) {
    if (counter.resetAt <= now) {
      store.delete(key);
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
  while (store.size > MAX_RATE_LIMIT_KEYS) {
    const oldestKey = store.keys().next().value as string | undefined;
    if (!oldestKey) {
      break;
    }
    store.delete(oldestKey);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  cleanupIfNeeded(now);

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const counter = { count: 1, resetAt: now + windowMs };
    store.set(key, counter);
    enforceSizeLimit();
    return { allowed: true, remaining: limit - 1, resetAt: counter.resetAt };
  }
  if (existing.count < limit) {
    existing.count += 1;
    return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
  }
  return { allowed: false, remaining: 0, resetAt: existing.resetAt };
}
