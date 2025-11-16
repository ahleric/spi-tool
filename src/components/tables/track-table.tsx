"use client";

import Link from "next/link";
import dayjs from "dayjs";
import type { Track } from "@prisma/client";
import { getLocaleClient, t, type Locale } from "@/lib/i18n";
import { useEffect, useState } from "react";

type Props = {
  tracks: Track[];
};

export function TrackTable({ tracks }: Props) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    setLocale(getLocaleClient());
  }, []);

  if (!tracks.length) {
    return (
      <div className="glass rounded-2xl md:rounded-3xl p-6 md:p-8 text-center text-xs md:text-sm text-slate-400">
        {t(locale, "noTracks")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto overflow-hidden rounded-2xl md:rounded-3xl border border-emerald-500/15 bg-neutral-900/70">
      <table className="w-full text-left text-xs md:text-sm text-slate-200">
        <thead className="bg-white/5 text-xs uppercase tracking-widest text-slate-400">
          <tr>
            <th className="px-3 md:px-6 py-2 md:py-3">{t(locale, "song")}</th>
            <th className="px-3 md:px-6 py-2 md:py-3 hidden sm:table-cell">{t(locale, "albumCol")}</th>
            <th className="px-3 md:px-6 py-2 md:py-3">
              {locale === "zh" ? "流行指数" : "Popularity"}
            </th>
            <th className="px-3 md:px-6 py-2 md:py-3 hidden md:table-cell">{t(locale, "updateDate")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {tracks.map((track) => (
            <tr key={track.id} className="transition hover:bg-white/5">
              <td className="px-3 md:px-6 py-3 md:py-4">
                <Link
                  href={`/track/${track.id}?from=artist`}
                  className="font-medium text-white hover:text-brand-primary"
                >
                  {track.name}
                </Link>
              </td>
              <td className="px-3 md:px-6 py-3 md:py-4 text-slate-400 hidden sm:table-cell">
                {track.album ?? " - "}
              </td>
              <td className="px-3 md:px-6 py-3 md:py-4 font-semibold text-brand-primary">
                {track.spi?.toFixed(1) ?? "-"}
              </td>
              <td className="px-3 md:px-6 py-3 md:py-4 text-slate-400 hidden md:table-cell">
                {dayjs(track.updatedAt ?? track.createdAt).format("YYYY/MM/DD")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
