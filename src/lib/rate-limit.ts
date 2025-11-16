type Counter = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Counter>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const counter = { count: 1, resetAt: now + windowMs };
    store.set(key, counter);
    return { allowed: true, remaining: limit - 1, resetAt: counter.resetAt };
  }
  if (existing.count < limit) {
    existing.count += 1;
    return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
  }
  return { allowed: false, remaining: 0, resetAt: existing.resetAt };
}

