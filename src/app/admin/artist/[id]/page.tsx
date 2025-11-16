import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEvents, getEventMetrics } from "@/lib/services/event";
import { EventTable } from "@/components/admin/event-table";
import { EventChart } from "@/components/admin/event-chart";
import { FunnelChart } from "@/components/admin/funnel-chart";
import { Pagination } from "@/components/pagination/pagination";
import { EventTypeBadge } from "@/components/admin/event-type-badge";

type Props = { params: { id: string }; searchParams?: { page?: string; type?: string; from?: string; to?: string } };

export default async function AdminArtistDetail({ params, searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect(`/admin/login?redirect=/admin/artist/${params.id}`);

  const page = Number(searchParams?.page ?? "1") || 1;
  const type = searchParams?.type;
  const from = searchParams?.from ? new Date(searchParams?.from) : undefined;
  const to = searchParams?.to ? new Date(searchParams?.to) : undefined;

  const filters = { type, from, to, artistId: params.id } as const;

  const [list, metrics, allTypes, artist] = await Promise.all([
    getEvents({ page, pageSize: 15, filters }),
    getEventMetrics(filters),
    getEventMetrics({ artistId: params.id }),
    prisma.artist.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, imageUrl: true, spotifyUrl: true },
    }),
  ]);

  const typeMap = new Map(metrics.byType.map((r) => [r.type, r.count]));
  const funnelSteps = [
    { label: "搜索", count: typeMap.get("search") ?? 0 },
    { label: "艺人页浏览", count: typeMap.get("artist_view") ?? 0 },
    { label: "歌曲页浏览", count: typeMap.get("track_view") ?? 0 },
    { label: "跳转Spotify", count: typeMap.get("track_open") ?? 0 },
  ];
  const typeOptions = allTypes.byType.map((t) => t.type).sort();

  // Top tracks click detail (grouped by track)
  const whereClicks: any = { artistId: params.id, type: "track_open" };
  if (from || to) {
    whereClicks.createdAt = {};
    if (from) whereClicks.createdAt.gte = from;
    if (to) whereClicks.createdAt.lte = to;
  }
  const topClicks = await prisma.eventLog.groupBy({
    by: ["trackId", "trackName"],
    where: whereClicks,
    _count: { trackId: true },
    orderBy: { _count: { trackId: "desc" } },
    take: 10,
  });

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 md:px-8">
      <header className="space-y-4">
        <Link href="/admin" className="text-sm text-slate-400 hover:text-white">← 返回仪表盘</Link>
        <h1 className="text-2xl font-display font-semibold text-white">艺人漏斗与事件 · {artist?.name || params.id}</h1>
        <ArtistFilterForm defaults={searchParams} types={typeOptions} />
      </header>

      {artist && (
        <section className="glass flex items-center gap-4 rounded-3xl border border-white/10 bg-white/5 p-4">
          {artist.imageUrl ? (
            <Image
              src={artist.imageUrl}
              alt={artist.name}
              width={64}
              height={64}
              className="h-16 w-16 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-xl font-semibold text-slate-400">
              {artist.name.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-white truncate">
              {artist.name}
            </p>
            <p className="text-xs text-slate-400 truncate">
              Artist ID: {artist.id}
            </p>
            {artist.spotifyUrl && (
              <a
                href={artist.spotifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-brand-primary hover:underline"
              >
                在 Spotify 中打开
              </a>
            )}
          </div>
        </section>
      )}

      <section className="glass rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">漏斗</p>
        <div className="mt-4">
          <FunnelChart steps={funnelSteps} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <EventChart timeline={metrics.timeline} />
        <div className="glass rounded-3xl p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">事件类型分布</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {metrics.byType.map((item) => (
              <EventTypeBadge key={item.type} type={item.type} count={item.count} />
            ))}
            {!metrics.byType.length ? (
              <p className="text-sm text-slate-400">暂无数据</p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Top tracks click detail */}
      {topClicks.length > 0 && (
        <section className="glass rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Top tracks 点击明细</p>
          <div className="mt-3 space-y-2">
            {topClicks.map((row, idx) => (
              <div key={`${row.trackId}-${idx}`} className="flex items-center justify-between rounded-2xl border border-white/10 p-3">
                <div className="min-w-0">
                  <p className="text-white truncate">{idx + 1}. {row.trackName || row.trackId}</p>
                  <p className="text-xs text-slate-400">trackId: {row.trackId}</p>
                </div>
                <div className="text-sm text-slate-200">点击：{(row as any)._count?.trackId ?? 0}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <EventTable events={list.events} />
        <Pagination page={list.pagination.page} totalPages={list.pagination.totalPages} />
      </section>
    </main>
  );
}

function ArtistFilterForm({ defaults, types }: { defaults?: { type?: string; from?: string; to?: string }; types?: string[] }) {
  return (
    <form className="glass grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 md:grid-cols-5">
      <select
        name="type"
        defaultValue={defaults?.type || ""}
        className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
      >
        <option value="">全部类型</option>
        {(types || []).map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <input type="date" name="from" defaultValue={defaults?.from} className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30" />
      <input type="date" name="to" defaultValue={defaults?.to} className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30" />
      <button type="submit" className="rounded-2xl bg-brand-primary/90 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-brand-primary">筛选</button>
    </form>
  );
}
