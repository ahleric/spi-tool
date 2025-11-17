import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArtistDetail } from "@/lib/services/artist";
import { TrackTable } from "@/components/tables/track-table";
import { Pagination } from "@/components/pagination/pagination";
import { SpiChart } from "@/components/charts/spi-chart";
import { PageViewLogger } from "@/components/analytics/page-view-logger";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { ArtistSyncBanner } from "@/components/artist/artist-sync-banner";

type Props = {
  params: { id: string };
  searchParams: { page?: string };
};

export default async function ArtistPage({ params, searchParams }: Props) {
  const locale = await getLocale();
  const page = Number(searchParams?.page ?? "1");
  
  let detail;
  try {
    detail = await getArtistDetail({
      artistId: params.id,
      page: Number.isNaN(page) ? 1 : page,
    });
  } catch (err) {
    console.error("[ArtistPage] Error fetching artist detail:", err);
    // If getArtistDetail fails, try to get basic artist info at least
    try {
      const { getArtistById } = await import("@/lib/spotify");
      const spotifyArtist = await getArtistById(params.id);
      detail = {
        artist: {
          id: spotifyArtist.id,
          name: spotifyArtist.name,
          imageUrl: null,
          followers: spotifyArtist.followers?.total ?? 0,
          popularity: spotifyArtist.popularity ?? 0,
          spi: 0,
          genres: spotifyArtist.genres ?? [],
        } as any,
        stats: {
          followers: spotifyArtist.followers?.total ?? 0,
          popularity: spotifyArtist.popularity ?? 0,
          spi: 0,
          isFirstIndexed: false,
          isComputing: false,
        },
        tracks: [],
        snapshots: [],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 1,
        },
      };
    } catch (fallbackErr) {
      console.error("[ArtistPage] Fallback also failed:", fallbackErr);
      notFound();
    }
  }

  if (!detail?.artist) {
    notFound();
  }

  const showSyncBanner =
    detail.artist.name === "Unknown Artist" || detail.stats.isComputing;

  const chartPoints = detail.snapshots.map((snapshot) => ({
    capturedAt: snapshot.capturedAt.toISOString(),
    spi: snapshot.spi,
    popularity: snapshot.spotifyPopularity,
  }));

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 md:gap-8 px-4 pb-24 pt-4 md:px-8 md:py-10">
      <PageViewLogger
        type="artist_view"
        artistId={detail.artist.id}
        artistName={detail.artist.name === "Unknown Artist" ? undefined : detail.artist.name}
      />
      <Link href="/" className="text-sm text-slate-400 hover:text-white w-fit">
        ← {t(locale, "backToHome")}
      </Link>

      <section className="glass grid gap-6 md:gap-8 rounded-2xl md:rounded-3xl border border-emerald-500/15 bg-neutral-900/50 p-4 md:p-6 md:grid-cols-[200px,1fr]">
        {detail.artist.imageUrl ? (
          <Image
            src={detail.artist.imageUrl}
            alt={detail.artist.name}
            width={200}
            height={200}
            className="h-32 w-32 md:h-48 md:w-48 rounded-2xl object-cover mx-auto md:mx-0"
          />
        ) : (
          <div className="flex h-32 w-32 md:h-48 md:w-48 items-center justify-center rounded-2xl bg-neutral-800 text-3xl md:text-4xl font-semibold text-slate-500 mx-auto md:mx-0">
            {detail.artist.name.slice(0, 1)}
          </div>
        )}
        <div className="space-y-3 md:space-y-4">
          <div>
            <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-slate-400">
              {t(locale, "artistOverview")}
            </p>
            <h1 className="text-2xl md:text-3xl font-display font-semibold text-white mt-1">
              {detail.artist.name}
            </h1>
            {detail.artist.genres?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {detail.artist.genres.map((genre: string) => (
                  <span
                    key={genre}
                    className="inline-flex items-center rounded-full border border-emerald-500/30 bg-neutral-900/80 px-2.5 py-0.5 text-[10px] md:text-xs font-medium text-emerald-200"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-2">
            <Metric
              label={locale === "zh" ? "流行指数" : "Popularity"}
              value={detail.stats.spi.toFixed(1)}
              accent
              locale={locale}
            />
            <Metric
              label={t(locale, "followers")}
              value={Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en", {
                notation: "compact",
              }).format(detail.stats.followers)}
              locale={locale}
            />
          </div>
        </div>
      </section>

      <ArtistSyncBanner artistId={detail.artist.id} showBanner={showSyncBanner} />

      <SpiChart
        points={chartPoints}
        title={`${detail.artist.name} ${locale === "zh" ? "流行指数" : "Popularity"}`}
      />

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl md:text-2xl font-display font-semibold text-white">
            {t(locale, "topTracks")}
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            {t(locale, "topTracksDesc", { count: detail.pagination.total })}
          </p>
        </div>
        <TrackTable tracks={detail.tracks} />
        <Pagination
          page={detail.pagination.page}
          totalPages={detail.pagination.totalPages}
        />
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  accent,
  locale,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
  locale: "zh" | "en";
}) {
  return (
    <div className="rounded-xl md:rounded-2xl border border-white/10 bg-white/5 p-3 md:p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 md:mt-2 text-xl md:text-2xl font-semibold ${
          accent ? "text-brand-primary" : "text-white"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
