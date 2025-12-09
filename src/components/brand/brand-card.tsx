import { getLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

export async function BrandCard() {
  const locale = await getLocale();
  const title = t(locale, "brandTitle");
  const desc = t(locale, "brandSubtitle");
  const email = "jun@peaktide.io";
  const wechat = "ahleric";

  return (
    <div className="glass relative overflow-hidden rounded-3xl border border-emerald-500/15 bg-gradient-to-br from-neutral-950 to-neutral-900 p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(29,185,84,0.22),transparent)]" />
      <div className="relative space-y-8">
        <div className="text-left space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-brand-primary">
            {title}
          </p>
          <h2 className="text-3xl font-display font-semibold leading-tight text-white md:text-4xl">
            {desc}
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {email && (
            <div className="rounded-2xl border border-emerald-500/10 bg-neutral-900/80 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                <span className="inline-flex h-4 w-4 items-center justify-center text-slate-400">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
                    <polyline points="3 7 12 13 21 7" />
                  </svg>
                </span>
                <span>Email</span>
              </div>
              <p className="mt-2 text-sm text-white break-all">
                {email}
              </p>
            </div>
          )}
          {wechat && (
            <div className="rounded-2xl border border-emerald-500/10 bg-neutral-900/80 p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                <span className="inline-flex h-4 w-4 items-center justify-center text-slate-400">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="5" width="18" height="12" rx="3" />
                    <path d="M8 19l-3 3v-4" />
                    <circle cx="9" cy="11" r="0.8" fill="currentColor" />
                    <circle cx="12" cy="11" r="0.8" fill="currentColor" />
                    <circle cx="15" cy="11" r="0.8" fill="currentColor" />
                  </svg>
                </span>
                <span>WeChat</span>
              </div>
              <p className="mt-2 text-sm text-white">
                {wechat}
              </p>
            </div>
          )}
          {/* Instagram / Website cards intentionally omitted for now */}
        </div>
      </div>
    </div>
  );
}
