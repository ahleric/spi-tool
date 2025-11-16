"use client";

import { useEffect, useRef } from "react";
import { logEventClient } from "@/lib/log-event";

type Props = {
  type: "artist_view" | "track_view";
  artistId?: string;
  artistName?: string;
  trackId?: string;
  trackName?: string;
};

export function PageViewLogger({
  type,
  artistId,
  artistName,
  trackId,
  trackName,
}: Props) {
  const hasLoggedRef = useRef(false);

  useEffect(() => {
    // Avoid duplicate logging caused by React StrictMode double-invoking effects in development
    if (hasLoggedRef.current) return;
    hasLoggedRef.current = true;

    logEventClient({
      type,
      artistId,
      artistName,
      trackId,
      trackName,
    });
  }, [type, artistId, artistName, trackId, trackName]);

  return null;
}

