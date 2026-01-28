"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useTopLoader } from "@/components/top-loader";
import { getLocaleClient, t, type Locale } from "@/lib/i18n";
import { SearchSuggestions, type SuggestionItem } from "@/components/search/search-suggestions";

type SearchResponse =
  | {
      type: "artist";
      id: string;
      name?: string;
    }
  | {
      type: "track";
      id: string;
      name?: string;
    };

export function SearchForm({ initialLocale }: { initialLocale?: Locale } = {}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [locale, setLocale] = useState<Locale>(initialLocale ?? "en");
  const [recent, setRecent] = useState<SuggestionItem[]>([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const topLoader = useTopLoader();
  const isBusy = loading || isPending;
  const RECENT_KEY = "spi_recent_searches_v1";

  useEffect(() => {
    setLocale(initialLocale ?? getLocaleClient());
  }, [initialLocale]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(RECENT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SuggestionItem[];
        setRecent(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setSuggestLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setSuggestLoading(true);
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(trimmed)}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await res.json();
        if (res.ok && data?.ok && Array.isArray(data?.suggestions)) {
          setSuggestions(data.suggestions);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        if ((err as Error)?.name !== "AbortError") {
          setSuggestions([]);
        }
      } finally {
        setSuggestLoading(false);
      }
    }, 280);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  const persistRecent = (item: SuggestionItem) => {
    try {
      setRecent((prev) => {
        const next = [item, ...prev]
          .filter((value, index, self) => {
            const key = `${value.type}:${value.id ?? value.name}`;
            return self.findIndex((v) => `${v.type}:${v.id ?? v.name}` === key) === index;
          })
          .slice(0, 8);
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        return next;
      });
    } catch {
      // ignore
    }
  };

  const handlePickSuggestion = (item: SuggestionItem) => {
    if (item.type === "query") {
      setQuery(item.query ?? item.name);
      setSuggestOpen(false);
      return;
    }
    if (item.id) {
      persistRecent(item);
      setSuggestOpen(false);
      startTransition(() => {
        router.push(item.type === "artist" ? `/artist/${item.id}` : `/track/${item.id}`);
      });
    } else {
      setQuery(item.name);
      setSuggestOpen(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) {
      setError(t(locale, "searchError"));
      return;
    }
    setError(null);
    setLoading(true);
    topLoader.show();

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      console.log("[SearchForm] Starting search for:", query);
      const response = await fetch(`/api/resolve?q=${encodeURIComponent(query)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("[SearchForm] Response status:", response.status, response.ok);

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await response.text();
        console.error("[SearchForm] Non-JSON response:", text);
        throw new Error(t(locale, "searchFailed"));
      }

      const data = await response.json();
      console.log("[SearchForm] Response data:", data);

      if (!response.ok || !data?.ok) {
        // Provide user-friendly error messages
        let errorMessage = data?.error || t(locale, "searchFailed");
        if (response.status === 429) {
          errorMessage = "搜索服务暂时繁忙，请稍后再试。";
        } else if (response.status >= 500) {
          errorMessage = "服务器错误，请稍后再试。";
        } else if (response.status === 404) {
          errorMessage = "未找到相关结果，请尝试其他关键词。";
        }
        console.error("[SearchForm] API error:", errorMessage);
        throw new Error(errorMessage);
      }

      if (!data.kind || !data.id) {
        console.error("[SearchForm] Invalid response data:", data);
        throw new Error(t(locale, "noResults"));
      }

      let destination: string | null = null;
      if (data.kind === "artist") {
        destination = `/artist/${data.id}`;
      } else if (data.kind === "track") {
        destination = `/track/${data.id}`;
      } else {
        console.error("[SearchForm] Unknown kind:", data.kind);
        throw new Error(t(locale, "noResults"));
      }

      console.log("[SearchForm] Navigating to:", destination);
      
      // Clear loading state immediately before navigation
      // This ensures UI doesn't stay in "searching" state even if page takes time to load
      setLoading(false);
      topLoader.hide();
      setSuggestOpen(false);
      
      // Use router.push with startTransition for better UX
      // The page might take time to load on server, but UI should not be stuck
      persistRecent({
        type: data.kind,
        id: data.id,
        name: query.trim(),
        source: "recent",
      });
      startTransition(() => {
        router.push(destination);
      });
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("[SearchForm] Search error:", err);
      
      let errorMessage = t(locale, "searchFailed");
      if (err instanceof Error) {
        if (err.name === "AbortError" || err.message.includes("timeout")) {
          errorMessage = "请求超时，请稍后再试。";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setLoading(false);
      topLoader.hide();
    }
  };

  const normalizedQuery = query.trim().toLowerCase();
  const recentMatches = normalizedQuery
    ? recent.filter((item) => item.name.toLowerCase().includes(normalizedQuery))
    : recent;

  const exampleItems: SuggestionItem[] =
    locale === "zh"
      ? [
          {
            type: "query",
            name: "万能青年旅店",
            query: "https://open.spotify.com/artist/4ntvojSPscU3PxselAEeY2?si=kGXAhEBCTgWRYVzYm-Ahjg",
            subtitle: "Spotify 主页",
            source: "example",
          },
          {
            type: "query",
            name: "草东没有派对",
            query: "https://open.spotify.com/artist/3HXSUfI76zVZk71UMAeVfp?si=gwwMcpQ7QFa8vx6Ryh31vw",
            subtitle: "Spotify 主页",
            source: "example",
          },
          {
            type: "query",
            name: "重塑雕像的权利",
            query: "https://open.spotify.com/artist/3iW4UAZQOJEXLW7L3H04gm?si=S_9o3N0MTkSXqR-eEIcBEw",
            subtitle: "Spotify 主页",
            source: "example",
          },
        ]
      : [
          { type: "query", name: "Taylor Swift", source: "example" },
          { type: "query", name: "The Weeknd", source: "example" },
          { type: "query", name: "https://open.spotify.com/artist/06HL4z0CvFAxyc27GXpf02", source: "example" },
        ];

  const exampleMatches = normalizedQuery
    ? exampleItems.filter((item) => item.name.toLowerCase().includes(normalizedQuery))
    : exampleItems;
  const popularItems = suggestions.filter((item) => item.source === "popular");
  const matchItems = suggestions.filter((item) => item.source !== "popular");

  return (
    <form
      onSubmit={handleSubmit}
      className="glass w-full rounded-2xl md:rounded-3xl border border-white/10 bg-slate-900/40 p-4 md:p-6 shadow-glow"
    >
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-start">
          <div className="flex-1">
            <div className="input-glow-container rounded-xl md:rounded-2xl relative [--glow-radius:12px] md:[--glow-radius:16px]">
              <div className="input-mask-bg rounded-xl md:rounded-2xl">
                <input
                  type="text"
                  className="w-full appearance-none rounded-xl md:rounded-2xl border-none bg-transparent px-4 py-3 text-base md:text-lg text-white text-center md:text-left placeholder:text-center md:placeholder:text-left outline-none transition disabled:opacity-50 focus:outline-none"
                  placeholder={t(locale, "searchPlaceholder")}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onFocus={() => setSuggestOpen(true)}
                  onBlur={() => setTimeout(() => setSuggestOpen(false), 150)}
                  disabled={isBusy}
                  aria-label={t(locale, "searchPlaceholder")}
                />
              </div>
            </div>
            <SearchSuggestions
              locale={locale}
              query={query}
              loading={suggestLoading}
              matchItems={matchItems}
              popularItems={popularItems}
              recentItems={recentMatches}
              exampleItems={exampleMatches}
              visible={suggestOpen}
              onPick={handlePickSuggestion}
            />
          </div>
          <button
            type="submit"
            disabled={isBusy}
            className={clsx(
              "inline-flex items-center justify-center gap-2 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 text-base md:text-lg font-semibold transition relative overflow-hidden whitespace-nowrap min-w-[120px]",
              "md:self-start",
              isBusy
                ? "cursor-not-allowed bg-slate-700 text-slate-300"
                : "bg-brand-primary text-slate-900 shadow-glow hover:bg-brand-primary/90 hover:shadow-[0_0_45px_rgba(29,185,84,0.6)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 animate-button-glow",
            )}
          >
            {isBusy && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-800 border-t-transparent" />
            )}
            {!isBusy && (
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="16.65" y1="16.65" x2="21" y2="21" />
              </svg>
            )}
            <span>{isBusy ? t(locale, "searching") : t(locale, "searchButtonText")}</span>
          </button>
        </div>
        {error ? (
          <div className="mt-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs md:text-sm font-semibold text-rose-200" role="alert">
            {error}
          </div>
        ) : null}
        {locale === "zh" ? (
          <p className="text-xs md:text-sm text-slate-400 text-center">
            <span className="block">支持艺术家名称、Spotify 链接、URI 或 ID</span>
            <span className="block">若使用艺术家名称搜索，请确保与Spotify名称一致</span>
          </p>
        ) : (
          <p className="text-xs md:text-sm text-slate-400">
            {t(locale, "searchHint")}
          </p>
        )}
      </div>
    </form>
  );
}
