import { BrandCard } from "@/components/brand/brand-card";
import { SearchForm } from "@/components/search/search-form";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export default async function Home() {
  const locale = await getLocale();

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 md:gap-10 px-4 pb-24 pt-10 md:px-8 md:py-16">
      <section className="space-y-4 md:space-y-6 text-center md:text-left">
        <p className="text-xs md:text-sm uppercase tracking-[0.4em] text-brand-primary">
          Spotify Popularity Intelligence
        </p>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-white">
          {t(locale, "title")}
        </h1>
        <p className="text-sm md:text-base lg:text-lg text-slate-300">
          {t(locale, "subtitle")}
        </p>
      </section>

      <SearchForm />
      
      <section className="glass w-full rounded-2xl md:rounded-3xl border border-emerald-500/15 bg-neutral-900/60 p-4 md:p-6 space-y-2 md:space-y-3">
        <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-slate-400">
          SPI Insight
        </p>
        <h2 className="text-lg md:text-xl font-display font-semibold text-white">
          {t(locale, "spiIntroTitle")}
        </h2>
        <p className="text-xs md:text-sm text-slate-300">
          {t(locale, "spiIntroSummary")}
        </p>
        <div>
          <a
            href="/spi"
            className="inline-flex items-center rounded-xl bg-white/90 px-4 py-2 text-xs md:text-sm font-semibold text-slate-900 hover:bg-white"
          >
            {t(locale, "spiIntroCta")}
          </a>
        </div>
      </section>

      <BrandCard />
    </main>
  );
}
