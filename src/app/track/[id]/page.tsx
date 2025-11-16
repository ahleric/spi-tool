import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrackDetail } from "@/lib/services/track";
import { SpiChart } from "@/components/charts/spi-chart";
import { PageViewLogger } from "@/components/analytics/page-view-logger";
import { OpenSpotifyButton } from "@/components/analytics/open-spotify-button";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

type Props = {
  params: { id: string };
  searchParams: { from?: string };
};

export default async function TrackPage({ params, searchParams }: Props) {
  const locale = await getLocale();
  const detail = await getTrackDetail(params.id);
  if (!detail) {
    notFound();
  }

  const chartPoints = detail.snapshots.map((snapshot) => ({
    capturedAt: snapshot.capturedAt.toISOString(),
    spi: snapshot.spi,
    popularity: snapshot.spotifyPopularity,
  }));

  // Determine back link: if from artist page, go back to artist; otherwise go to home
  const backHref = searchParams.from === "artist" && detail.artist
    ? `/artist/${detail.artist.id}`
    : "/";
  const backText = searchParams.from === "artist" 
    ? t(locale, "backToArtist")
    : t(locale, "backToHome");

  const durationMinutes = Math.floor(detail.stats.durationMs / 1000 / 60);
  const durationSeconds = Math.floor((detail.stats.durationMs / 1000) % 60);
  const durationFormatted = `${durationMinutes}:${String(durationSeconds).padStart(2, "0")}`;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 md:gap-8 px-4 pb-24 pt-4 md:px-8 md:py-10">
      <PageViewLogger
        type="track_view"
        trackId={detail.track.id}
        trackName={detail.track.name}
        artistId={detail.artist?.id}
        artistName={detail.artist?.name}
      />
      <Link href={backHref} className="text-sm text-slate-400 hover:text-white w-fit">
        ← {backText}
      </Link>

      <section className="glass rounded-2xl md:rounded-3xl border border-white/10 bg-slate-900/40 p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Album Cover */}
          {detail.track.imageUrl ? (
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <Image
                src={detail.track.imageUrl}
                alt={detail.track.name}
                width={200}
                height={200}
                className="h-40 w-40 md:h-56 md:w-56 rounded-2xl object-cover"
              />
            </div>
          ) : (
            <div className="flex h-40 w-40 md:h-56 md:w-56 items-center justify-center rounded-2xl bg-slate-800 text-3xl md:text-4xl font-semibold text-slate-500 mx-auto md:mx-0">
              {detail.track.name.slice(0, 1)}
            </div>
          )}
          
          <div className="flex-1 space-y-3 md:space-y-4">
            <div>
              <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-slate-400">
                {t(locale, "trackInsight")}
              </p>
              <h1 className="text-xl md:text-3xl font-display font-semibold text-white mt-1">
                {detail.track.name}
              </h1>
              {detail.artist ? (
                <p className="text-xs md:text-sm text-slate-400 mt-1">
                  {t(locale, "by")}{" "}
                  <Link
                    href={`/artist/${detail.artist.id}`}
                    className="text-brand-primary hover:underline"
                  >
                    {detail.artist.name}
                  </Link>
                </p>
              ) : null}
              {detail.track.album ? (
                <p className="text-xs md:text-sm text-slate-400 mt-1">
                  {t(locale, "album")}：{detail.track.album}
                </p>
              ) : null}
            </div>
            <div className="grid gap-3 md:gap-4 grid-cols-2">
              <Metric
                label={locale === "zh" ? "流行指数" : "Popularity"}
                value={detail.stats.spi.toFixed(1)}
                accent
                locale={locale}
              />
              <Metric
                label={t(locale, "duration")}
                value={durationFormatted}
                locale={locale}
              />
            </div>
            <div>
              <OpenSpotifyButton
                url={`https://open.spotify.com/track/${detail.track.id}`}
                trackId={detail.track.id}
                trackName={detail.track.name}
                artistId={detail.artist?.id}
                artistName={detail.artist?.name}
                className="inline-flex items-center gap-2 rounded-xl bg-black dark:bg-white px-4 py-2 text-sm md:text-base text-white dark:text-black hover:opacity-90 transition w-full md:w-auto justify-center"
              />
            </div>
          </div>
        </div>
      </section>

      <SpiChart
        points={chartPoints}
        title={`${detail.track.name} ${locale === "zh" ? "流行指数" : "Popularity"}`}
      />
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
  value: string | number;
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
