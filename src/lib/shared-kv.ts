import { env } from "@/lib/env";

type UpstashResponse<T> = {
  result?: T;
  error?: string;
};

const HAS_SHARED_KV = Boolean(
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN,
);

async function sendCommand<T>(
  command: Array<string | number>,
): Promise<T | null> {
  if (!HAS_SHARED_KV) {
    return null;
  }

  try {
    const response = await fetch(env.UPSTASH_REDIS_REST_URL!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.UPSTASH_REDIS_REST_TOKEN!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Upstash request failed: ${response.status}`);
    }

    const data = (await response.json()) as UpstashResponse<T>;
    if (data.error) {
      throw new Error(data.error);
    }

    return (data.result ?? null) as T | null;
  } catch (error) {
    console.warn("Shared KV request failed, falling back to local store", error);
    return null;
  }
}

export function hasSharedKv() {
  return HAS_SHARED_KV;
}

export async function getSharedJson<T>(key: string): Promise<T | null> {
  const raw = await sendCommand<string | null>(["GET", key]);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setSharedJson(
  key: string,
  value: unknown,
  ttlMs: number,
): Promise<boolean> {
  if (!HAS_SHARED_KV) {
    return false;
  }

  const ok = await sendCommand<string>([
    "SET",
    key,
    JSON.stringify(value),
    "PX",
    Math.max(1_000, ttlMs),
  ]);
  return ok === "OK";
}

export async function incrementSharedFixedWindow(
  key: string,
  limit: number,
  windowMs: number,
) {
  if (!HAS_SHARED_KV) {
    return null;
  }

  const now = Date.now();
  const bucketStart = now - (now % windowMs);
  const bucketKey = `${key}:${bucketStart}`;
  const count = Number(await sendCommand<number>(["INCR", bucketKey]));
  if (!Number.isFinite(count)) {
    return null;
  }

  await sendCommand<string>([
    "PEXPIRE",
    bucketKey,
    Math.max(windowMs * 2, windowMs + 1_000),
  ]);

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: bucketStart + windowMs,
  };
}
