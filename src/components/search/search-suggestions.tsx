"use client";

import type { ReactNode } from "react";
import clsx from "clsx";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export type SuggestionItem = {
  type: "artist" | "track" | "query";
  id?: string;
  name: string;
  query?: string;
  subtitle?: string;
  source?: "popular" | "match" | "recent" | "example" | "action";
  count?: number;
};

type SearchSuggestionsProps = {
  locale: Locale;
  query: string;
  loading: boolean;
  matchItems: SuggestionItem[];
  popularItems: SuggestionItem[];
  recentItems: SuggestionItem[];
  exampleItems: SuggestionItem[];
  visible: boolean;
  onPick: (item: SuggestionItem) => void;
};

export function SearchSuggestions({
  locale,
  query,
  loading,
  matchItems,
  popularItems,
  recentItems,
  exampleItems,
  visible,
  onPick,
}: SearchSuggestionsProps) {
  if (!visible) return null;

  const hasQuery = query.trim().length > 0;
  const showLoading = loading && query.trim().length >= 2;
  const showEmpty =
    !loading &&
    query.trim().length >= 2 &&
    matchItems.length === 0 &&
    popularItems.length === 0 &&
    recentItems.length === 0 &&
    exampleItems.length === 0;

  const actionItem: SuggestionItem | null =
    query.trim().length >= 2
      ? {
          type: "query",
          name: t(locale, "suggestSearchAction", { query }),
          query: query.trim(),
          source: "action",
        }
      : null;

  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-neutral-950/70 p-3 md:p-4 backdrop-blur-xl">
      {showLoading ? (
        <p className="text-xs md:text-sm text-slate-400">{t(locale, "suggestLoading")}</p>
      ) : null}

      {!showLoading && actionItem ? (
        <div className="mb-3">
          <SuggestionList items={[actionItem]} onPick={onPick} locale={locale} />
        </div>
      ) : null}

      {!showLoading && popularItems.length > 0 ? (
        <Section title={t(locale, "suggestPopular")}>
          <SuggestionList items={popularItems} onPick={onPick} locale={locale} />
        </Section>
      ) : null}

      {!showLoading && matchItems.length > 0 ? (
        <Section title={t(locale, "suggestMatches")}>
          <SuggestionList items={matchItems} onPick={onPick} locale={locale} />
        </Section>
      ) : null}

      {!showLoading && recentItems.length > 0 ? (
        <Section title={t(locale, "suggestRecent")}>
          <SuggestionList items={recentItems} onPick={onPick} locale={locale} />
        </Section>
      ) : null}

      {!showLoading && exampleItems.length > 0 ? (
        <Section title={t(locale, "suggestExamples")}>
          <SuggestionList items={exampleItems} onPick={onPick} locale={locale} />
        </Section>
      ) : null}

      {showEmpty ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs md:text-sm text-slate-300">
          {t(locale, "suggestEmpty")}
        </div>
      ) : null}

      {!hasQuery && !showLoading && matchItems.length === 0 && popularItems.length === 0 && recentItems.length === 0 && exampleItems.length === 0 ? (
        <p className="text-xs md:text-sm text-slate-500">{t(locale, "suggestHint")}</p>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500">
        {title}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function SuggestionList({
  items,
  onPick,
  locale,
}: {
  items: SuggestionItem[];
  onPick: (item: SuggestionItem) => void;
  locale: Locale;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <button
          key={`${item.type}-${item.id ?? item.name}-${idx}`}
          type="button"
          className={clsx(
            "flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left text-xs md:text-sm text-white transition",
            "hover:border-emerald-400/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50",
            item.source === "action" && "border-emerald-400/40 bg-emerald-500/10",
          )}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onPick(item)}
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{item.name}</p>
            {item.subtitle ? (
              <p className="truncate text-[10px] md:text-xs text-slate-400">
                {item.subtitle}
              </p>
            ) : null}
          </div>
          <span className="shrink-0 rounded-full border border-emerald-400/40 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-emerald-200">
            {typeLabel(locale, item.type)}
          </span>
        </button>
      ))}
    </div>
  );
}

function typeLabel(locale: Locale, type: SuggestionItem["type"]) {
  if (locale === "zh") {
    if (type === "artist") return "艺人";
    if (type === "track") return "歌曲";
    return "搜索";
  }
  if (type === "artist") return "Artist";
  if (type === "track") return "Track";
  return "Search";
}
