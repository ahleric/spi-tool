import { BrandCard } from "@/components/brand/brand-card";
import { SearchForm } from "@/components/search/search-form";
import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export default async function Home() {
  const locale = await getLocale();

  return (
    <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-6 md:gap-10 px-4 pb-24 pt-10 md:px-8 md:py-16 overflow-hidden">
      <div className="pointer-events-none absolute -top-20 left-1/2 h-[280px] w-[680px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(29,185,84,0.35),transparent_65%)] blur-3xl opacity-80" />
      <div className="pointer-events-none absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_55%)]" />
      <section className="space-y-4 md:space-y-6 text-center md:text-left">
        <p className="text-xs md:text-sm uppercase tracking-[0.4em] text-brand-primary">
          Spotify Popularity Intelligence
        </p>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-semibold text-white">
          {t(locale, "title")}
        </h1>
        {locale === "zh" ? (
          <p className="text-sm md:text-base lg:text-lg text-slate-300 leading-relaxed">
            <span className="block">输入 Spotify 链接或艺人名称</span>
            <span className="block">查看最新流行指数和历史走势</span>
          </p>
        ) : (
          <p className="text-sm md:text-base lg:text-lg text-slate-300">
            {t(locale, "subtitle")}
          </p>
        )}
      </section>

      <SearchForm initialLocale={locale} />
      
      <section className="glass w-full rounded-2xl md:rounded-3xl border border-emerald-500/15 bg-neutral-900/60 p-4 md:p-6 space-y-2 md:space-y-3">
        <div className="flex flex-col gap-3 text-left">
          <h2 className="text-lg md:text-xl font-display font-semibold text-white">
            {t(locale, "spiIntroTitle")}
          </h2>
          <p className="text-xs md:text-sm text-slate-300">
            {t(locale, "spiIntroSummary")}
          </p>
          <div>
            <a
              href="/spi"
              className="inline-flex items-center justify-center rounded-xl bg-white/90 px-4 py-2 text-xs md:text-sm font-semibold text-slate-900 hover:bg-white"
            >
              {t(locale, "spiIntroCta")}
            </a>
          </div>
        </div>
      </section>

      <BrandCard />
    </main>
  );
}
