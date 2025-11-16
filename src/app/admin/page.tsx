import { notFound, redirect } from "next/navigation";
import { getEvents } from "@/lib/services/event";
import { getEventMetrics } from "@/lib/services/event";
import { EventTable } from "@/components/admin/event-table";
import { EventChart } from "@/components/admin/event-chart";
import { TopArtistsChart } from "@/components/admin/top-artists-chart";
import { Pagination } from "@/components/pagination/pagination";
import AdminActions from "./ui/AdminActions";
import { getSession } from "@/lib/auth";
import { FunnelChart } from "@/components/admin/funnel-chart";
import { TopArtistsList } from "@/components/admin/top-artists-list";
import { InterestScoreList } from "@/components/admin/interest-score";
import { getInterestScores } from "@/lib/services/event";
import { EventTypeBadge } from "@/components/admin/event-type-badge";

type Props = {
  searchParams?: {
    page?: string;
    type?: string;
    from?: string;
    to?: string;
    artist?: string;
    track?: string;
  };
};

export default async function AdminPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/admin/login?redirect=/admin");
  const page = Number(searchParams?.page ?? "1") || 1;
  const filters = {
    type: searchParams?.type,
    from: searchParams?.from ? new Date(searchParams?.from) : undefined,
    to: searchParams?.to ? new Date(searchParams?.to) : undefined,
    artistId: searchParams?.artist,
    trackId: searchParams?.track,
  };

  // Fetch current metrics and a global type list for filter dropdown
  const [list, metrics, allTypesMetrics, interest] = await Promise.all([
    getEvents({ page, filters, pageSize: 15 }),
    getEventMetrics(filters),
    getEventMetrics({ ...filters, type: undefined }),
    getInterestScores({ days: 30, limit: 10 }),
  ]);

  if (!list) {
    notFound();
  }

  // Build funnel data (search -> artist_view -> track_view -> track_open)
  const typeMap = new Map(metrics.byType.map((r) => [r.type, r.count]));
  const funnelSteps = [
    { label: "搜索", key: "search" },
    { label: "艺人页浏览", key: "artist_view" },
    { label: "歌曲页浏览", key: "track_view" },
    { label: "跳转Spotify", key: "track_open" },
  ].map((s) => ({ label: s.label, count: typeMap.get(s.key) ?? 0 }));

  // Prepare type options for filter dropdown
  const typeOptions = allTypesMetrics.byType.map((t) => t.type).sort();

  // Pick top artists and fetch per-artist funnel (limit 5)
  const topFive = metrics.topArtists.slice(0, 5);
  const perArtistFunnels = await Promise.all(
    topFive.map(async (a) => {
      const m = await getEventMetrics({ artistId: a.artistId });
      const mMap = new Map(m.byType.map((r) => [r.type, r.count]));
      return {
        artistId: a.artistId,
        artistName: a.artistName,
        steps: [
          { label: "搜索", count: mMap.get("search") ?? 0 },
          { label: "艺人页浏览", count: mMap.get("artist_view") ?? 0 },
          { label: "歌曲页浏览", count: mMap.get("track_view") ?? 0 },
          { label: "跳转Spotify", count: mMap.get("track_open") ?? 0 },
        ],
      };
    })
  );

  // Total events for share calculation in list
  const totalEvents = allTypesMetrics.byType.reduce((sum, r) => sum + r.count, 0);

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 md:px-8">
      <header className="space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-brand-primary">
          Admin Monitor
        </p>
        <h1 className="text-3xl font-display font-semibold text-white">
          行为事件仪表盘
        </h1>
        <AdminActions />
        <FilterForm defaults={searchParams} types={typeOptions} />
      </header>

      {/* Funnel overview */}
      <section className="glass rounded-3xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">漏斗概览</p>
        <div className="mt-4">
          <FunnelChart steps={funnelSteps} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <EventChart timeline={metrics.timeline} />
        <div className="glass rounded-3xl p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
            事件类型分布
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {metrics.byType.map((item) => (
              <EventTypeBadge key={item.type} type={item.type} count={item.count} />
            ))}
            {!metrics.byType.length ? <p className="text-sm text-slate-400">暂无数据</p> : null}
          </div>
        </div>
      </section>

      {metrics.topArtists.length > 0 && (
        <section className="space-y-6">
          <TopArtistsChart artists={metrics.topArtists} />
          <TopArtistsList artists={metrics.topArtists} total={totalEvents} />
        </section>
      )}

      {/* Interest scores */}
      {interest.length > 0 && (
        <section>
          <InterestScoreList items={interest} />
        </section>
      )}

      {/* Per-artist funnels */}
      {perArtistFunnels.length > 0 && (
        <section className="space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">按艺人漏斗</p>
          <div className="grid gap-4 md:grid-cols-2">
            {perArtistFunnels.map((a) => (
              <div key={a.artistId} className="glass rounded-3xl p-4">
                <p className="mb-3 text-sm text-white">{a.artistName}</p>
                <FunnelChart steps={a.steps} small />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <EventTable events={list.events} />
        <Pagination
          page={list.pagination.page}
          totalPages={list.pagination.totalPages}
        />
      </section>
    </main>
  );
}

function FilterForm({
  defaults,
  types,
}: {
  defaults?: { type?: string; from?: string; to?: string; artist?: string; track?: string };
  types?: string[];
}) {
  return (
    <form className="glass grid gap-4 rounded-3xl border border-emerald-500/15 bg-neutral-900/60 p-4 md:grid-cols-6">
      <select
        name="type"
        defaultValue={defaults?.type || ""}
        className="rounded-2xl border border-white/10 bg-neutral-900/70 px-3 py-2 text-sm text-white outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
      >
        <option value="">全部类型</option>
        {(types || []).map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <input
        type="text"
        name="artist"
        placeholder="艺人ID"
        defaultValue={defaults?.artist}
        className="rounded-2xl border border-white/10 bg-neutral-900/70 px-3 py-2 text-sm text-white outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
      />
      <input
        type="text"
        name="track"
        placeholder="单曲ID"
        defaultValue={defaults?.track}
        className="rounded-2xl border border-white/10 bg-neutral-900/70 px-3 py-2 text-sm text-white outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
      />
      <input
        type="date"
        name="from"
        defaultValue={defaults?.from}
        className="rounded-2xl border border-white/10 bg-neutral-900/70 px-3 py-2 text-sm text-white outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
      />
      <input
        type="date"
        name="to"
        defaultValue={defaults?.to}
        className="rounded-2xl border border-white/10 bg-neutral-900/70 px-3 py-2 text-sm text-white outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
      />
      <button
        type="submit"
        className="rounded-2xl bg-brand-primary/90 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-brand-primary"
      >
        筛选
      </button>
    </form>
  );
}
