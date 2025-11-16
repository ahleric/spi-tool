"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLocaleClient, type Locale, LOCALE_STORAGE_KEY } from "@/lib/i18n";

export function LocaleSwitcher() {
  const [locale, setLocale] = useState<Locale>("en");
  const router = useRouter();

  useEffect(() => {
    setLocale(getLocaleClient());
  }, []);

  const handleChange = (next: Locale) => {
    if (next === locale) return;
    setLocale(next);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
        document.cookie = `${LOCALE_STORAGE_KEY}=${next}; path=/; max-age=31536000`;
      }
    } catch {
      // ignore storage errors
    }
    router.refresh();
  };

  return (
    <div className="fixed right-3 top-3 md:right-6 md:top-6 z-50 flex items-center gap-1 rounded-full border border-emerald-500/20 bg-neutral-900/90 px-2 py-1 text-[10px] md:text-xs shadow-lg backdrop-blur">
      <button
        type="button"
        onClick={() => handleChange("en")}
        className={`rounded-full px-2 py-0.5 transition ${
          locale === "en"
            ? "bg-white text-slate-900"
            : "text-slate-300 hover:text-white"
        }`}
      >
        EN
      </button>
      <span className="text-slate-600">/</span>
      <button
        type="button"
        onClick={() => handleChange("zh")}
        className={`rounded-full px-2 py-0.5 transition ${
          locale === "zh"
            ? "bg-white text-slate-900"
            : "text-slate-300 hover:text-white"
        }`}
      >
        中文
      </button>
    </div>
  );
}
