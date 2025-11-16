"use client";
import Link from "next/link";

export function TopArtistsList({ artists, total }: { artists: { artistId: string; artistName: string; count: number }[]; total: number }) {
  if (!artists.length) return null;
  return (
    <div className="glass rounded-3xl p-6">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-400">查询最多的艺人 · 列表</p>
      <div className="mt-4 divide-y divide-white/10">
        {artists.map((a, i) => {
          const share = total > 0 ? Math.round((a.count / total) * 1000) / 10 : 0;
          return (
            <div key={a.artistId} className="flex items-center justify-between py-2">
              <div className="min-w-0">
                <p className="text-white truncate">{i + 1}. {a.artistName || a.artistId}</p>
                <p className="text-xs text-slate-400">事件数：{a.count} · 占比：{share}%</p>
              </div>
              <Link
                href={{ pathname: `/admin/artist/${a.artistId}` }}
                className="rounded-xl border border-white/10 px-3 py-1 text-xs text-white hover:bg-white/5"
              >
                查看漏斗
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
