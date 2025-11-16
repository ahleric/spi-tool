"use client";

type Score = {
  artistId: string;
  artistName: string;
  score: number;
  metrics: { search: number; artistView: number; trackView: number; trackOpen: number; conv1: number; conv2: number; conv3: number };
};

export function InterestScoreList({ items }: { items: Score[] }) {
  if (!items.length) return null;
  return (
    <div className="glass rounded-3xl p-6">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-400">潜在兴趣评分（Top）</p>
      <div className="mt-4 space-y-2">
        {items.map((s, i) => (
          <div key={s.artistId} className="flex items-center justify-between rounded-2xl border border-white/10 p-3">
            <div className="min-w-0">
              <p className="text-white truncate">{i + 1}. {s.artistName}</p>
              <p className="text-xs text-slate-400">search:{s.metrics.search} · artist:{s.metrics.artistView} · track:{s.metrics.trackView} · open:{s.metrics.trackOpen}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-lg font-semibold text-brand-primary">{s.score}</div>
              <a href={`/admin/artist/${encodeURIComponent(s.artistId)}`} className="rounded-xl border border-white/10 px-3 py-1 text-xs text-white hover:bg-white/5">查看</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
