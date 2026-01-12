"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useTopLoader } from "@/components/top-loader";
import { getLocaleClient, t, type Locale } from "@/lib/i18n";

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
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [locale, setLocale] = useState<Locale>(initialLocale ?? "en");
  const topLoader = useTopLoader();
  const isBusy = loading || isPending;

  useEffect(() => {
    setLocale(initialLocale ?? getLocaleClient());
  }, [initialLocale]);

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
      
      // Use router.push with startTransition for better UX
      // The page might take time to load on server, but UI should not be stuck
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

  return (
    <form
      onSubmit={handleSubmit}
      className="glass w-full rounded-2xl md:rounded-3xl border border-white/10 bg-slate-900/40 p-4 md:p-6 shadow-glow"
    >
      <div className="relative z-10 flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="input-glow-container flex-1 rounded-lg md:rounded-xl relative [--glow-radius:8px] md:[--glow-radius:12px]">
            <div className="input-mask-bg rounded-lg md:rounded-xl">
              <input
                type="text"
                className="w-full rounded-lg md:rounded-xl border-none bg-transparent px-4 py-3 text-base md:text-lg text-white text-center md:text-left placeholder:text-center md:placeholder:text-left outline-none transition disabled:opacity-50 focus:outline-none"
                placeholder={t(locale, "searchPlaceholder")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                disabled={isBusy}
                aria-label={t(locale, "searchPlaceholder")}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isBusy}
            className={clsx(
              "rounded-lg md:rounded-xl px-4 md:px-6 py-3 text-base md:text-lg font-semibold transition relative overflow-hidden whitespace-nowrap min-w-[120px] text-center md:text-left",
              isBusy
                ? "cursor-not-allowed bg-slate-700 text-slate-300"
                : "bg-brand-primary text-slate-900 shadow-glow hover:bg-brand-primary/90 hover:shadow-[0_0_45px_rgba(29,185,84,0.6)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 animate-button-glow",
            )}
          >
            {isBusy && (
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-800 border-t-transparent" />
            )}
            {isBusy ? t(locale, "searching") : t(locale, "searchButtonText")}
          </button>
        </div>
        {error ? (
          <p className="mt-1 text-xs md:text-sm font-semibold text-rose-400" role="alert">
            {error}
          </p>
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
