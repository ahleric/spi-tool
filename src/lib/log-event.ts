/**
 * Unified event logging SDK for both client and server
 * Automatically captures referrer, sessionId, userAgent, and IP
 */

type EventPayload = {
  type: string;
  artistId?: string;
  artistName?: string;
  trackId?: string;
  trackName?: string;
  input?: string;
  referrer?: string;
  sessionId?: string;
};

/**
 * Client-side event logging
 * Automatically captures referrer and sessionId from browser
 */
export async function logEventClient(payload: EventPayload): Promise<void> {
  try {
    // Get sessionId from localStorage or generate one
    let sessionId = typeof window !== "undefined" ? localStorage.getItem("spi_session_id") : null;
    if (!sessionId && typeof window !== "undefined") {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("spi_session_id", sessionId);
    }

    const fullPayload: EventPayload & { referrer?: string; sessionId?: string } = {
      ...payload,
      referrer: typeof window !== "undefined" ? document.referrer || undefined : undefined,
      sessionId: sessionId || undefined,
    };

    await fetch("/api/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fullPayload),
    });
  } catch (err) {
    // Silently fail - analytics should never break the app
    console.warn("Failed to log event:", err);
  }
}

/**
 * Server-side event logging
 * Requires explicit userAgent and IP from request
 */
export async function logEventServer(
  payload: EventPayload & {
    userAgent?: string;
    ip?: string;
    referrer?: string;
    sessionId?: string;
  },
): Promise<void> {
  try {
    const { recordEvent } = await import("@/lib/services/event");
    await recordEvent({
      type: payload.type,
      artistId: payload.artistId,
      artistName: payload.artistName,
      trackId: payload.trackId,
      trackName: payload.trackName,
      input: payload.input,
      userAgent: payload.userAgent,
      ip: payload.ip,
    });
  } catch (err) {
    // Silently fail - analytics should never break the app
    console.warn("Failed to log event:", err);
  }
}








