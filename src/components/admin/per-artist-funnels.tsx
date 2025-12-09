"use client";

import { useEffect, useState } from "react";
import { FunnelChart } from "@/components/admin/funnel-chart";

type TopArtist = { artistId: string; artistName: string; count: number };
type FunnelSteps = Array<{ label: string; count: number }>;

export function PerArtistFunnels({ topArtists }: { topArtists: TopArtist[] }) {
  const [data, setData] = useState<
    Array<{ artistId: string; artistName: string; steps: FunnelSteps }>
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!topArtists.length) return;
      setLoading(true);
      try {
        // 仅取前 3 位，避免过多请求
        const subset = topArtists.slice(0, 3);
        const results = await Promise.all(
          subset.map(async (a) => {
            const params = new URLSearchParams({ artist: a.artistId });
            const res = await fetch(`/api/event?${params.toString()}`);
            const json = await res.json();
            const m = json.metrics as { byType: Array<{ type: string; count: number }> };
            const map = new Map(m.byType.map((r) => [r.type, r.count]));
            const steps: FunnelSteps = [
              { label: "搜索", count: map.get("search") ?? 0 },
              { label: "艺人页浏览", count: map.get("artist_view") ?? 0 },
              { label: "歌曲页浏览", count: map.get("track_view") ?? 0 },
              { label: "跳转Spotify", count: map.get("track_open") ?? 0 },
            ];
            return { artistId: a.artistId, artistName: a.artistName, steps };
          })
        );
        setData(results);
      } catch {
        // 静默失败
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [topArtists]);

  if (!topArtists.length) {
    return null;
  }

  return (
    <section className="space-y-4">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-400">按艺人漏斗</p>
      {loading && (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="glass rounded-3xl p-4 animate-pulse h-28 bg-white/5" />
          ))}
        </div>
      )}
      {!loading && data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((a) => (
            <div key={a.artistId} className="glass rounded-3xl p-4">
              <p className="mb-3 text-sm text-white">{a.artistName}</p>
              <FunnelChart steps={a.steps} small />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
