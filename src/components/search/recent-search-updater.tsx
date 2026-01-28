"use client";

import { useEffect } from "react";

type RecentSearchUpdaterProps = {
  type: "artist" | "track";
  id: string;
  name: string;
};

const RECENT_KEY = "spi_recent_searches_v1";

export function RecentSearchUpdater({ type, id, name }: RecentSearchUpdaterProps) {
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(RECENT_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return;

      const next = parsed.map((item) => {
        if (item?.type === type && item?.id === id) {
          return { ...item, name };
        }
        return item;
      });

      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, [type, id, name]);

  return null;
}
