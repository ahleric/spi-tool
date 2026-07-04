"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import dayjs from "dayjs";
import { getLocaleClient, t, type Locale } from "@/lib/i18n";
import { useEffect, useMemo, useState } from "react";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
);

export type SpiPoint = {
  capturedAt: string;
  spi: number;
  popularity: number;
};

type Props = {
  points: SpiPoint[];
  title: string;
};

type RangeKey = "7d" | "28d" | "custom";

const DEFAULT_RANGE: RangeKey = "28d";

export function SpiChart({ points, title }: Props) {
  const [locale, setLocale] = useState<Locale>("en");
  const [range, setRange] = useState<RangeKey>(DEFAULT_RANGE);
  // Custom range bounds, kept as YYYY-MM-DD strings for <input type="date">.
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    setLocale(getLocaleClient());
  }, []);

  // Seed the custom range (last 28 days) the first time it's opened.
  useEffect(() => {
    if (range === "custom" && !customStart && !customEnd) {
      setCustomEnd(dayjs().format("YYYY-MM-DD"));
      setCustomStart(dayjs().subtract(28, "day").format("YYYY-MM-DD"));
    }
  }, [range, customStart, customEnd]);

  // Filter raw points by the selected date range (before de-duping below).
  const rangedPoints = useMemo(() => {
    if (!points?.length) return [];

    if (range === "custom") {
      // Ignore an incomplete custom range instead of blanking the chart.
      if (!customStart || !customEnd) return points;
      const start = dayjs(customStart).startOf("day");
      const end = dayjs(customEnd).endOf("day");
      return points.filter((point) => {
        const captured = dayjs(point.capturedAt);
        return !captured.isBefore(start) && !captured.isAfter(end);
      });
    }

    const days = range === "7d" ? 7 : 28;
    const cutoff = dayjs().subtract(days, "day").startOf("day");
    return points.filter((point) => !dayjs(point.capturedAt).isBefore(cutoff));
  }, [points, range, customStart, customEnd]);

  // No history at all: keep the original empty state, no controls to show.
  if (!points?.length) {
    return (
      <div className="glass flex h-48 md:h-64 w-full items-center justify-center rounded-2xl text-xs md:text-sm text-slate-400">
        {t(locale, "noHistoryData")}
      </div>
    );
  }

  const todayStr = dayjs().format("YYYY-MM-DD");

  // Collapse to at most one point per day (keep the latest of each day).
  const sortedPoints = [...rangedPoints].sort(
    (a, b) =>
      new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime(),
  );
  const dailyPoints: SpiPoint[] = [];
  let lastDay: string | null = null;

  for (const point of sortedPoints) {
    const dayKey = dayjs(point.capturedAt).format("YYYY-MM-DD");
    if (dayKey === lastDay && dailyPoints.length > 0) {
      dailyPoints[dailyPoints.length - 1] = point;
      continue;
    }
    dailyPoints.push(point);
    lastDay = dayKey;
  }

  const labels = dailyPoints.map((point) =>
    dayjs(point.capturedAt).format("MM/DD"),
  );

  const data = {
    labels,
    datasets: [
      {
        label: locale === "zh" ? "流行指数" : "Popularity",
        data: dailyPoints.map((point) => point.spi),
        borderColor: "#1DB954",
        backgroundColor: "rgba(29, 185, 84, 0.16)",
        fill: true,
        tension: 0.4,
        pointRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: "index" as const,
    },
    plugins: {
      legend: {
        labels: {
          color: "#e2e8f0",
        },
      },
      tooltip: {
        callbacks: {
          label(context: any) {
            const label =
              locale === "zh" ? "流行指数" : "Popularity";
            return ` ${label}: ${context.formattedValue}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#94a3b8" },
        grid: { color: "rgba(148, 163, 184, 0.1)" },
      },
      y: {
        beginAtZero: true,
        ticks: { color: "#94a3b8" },
        grid: { color: "rgba(148, 163, 184, 0.1)" },
      },
    },
  };

  const rangeButtons: { key: RangeKey; label: string }[] = [
    { key: "7d", label: t(locale, "range7d") },
    { key: "28d", label: t(locale, "range28d") },
    { key: "custom", label: t(locale, "rangeCustom") },
  ];

  return (
    <div className="glass rounded-2xl md:rounded-3xl p-4 md:p-6">
      <div className="mb-3 md:mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs md:text-sm uppercase tracking-widest text-slate-400">
            {t(locale, "spiTrend")}
          </p>
          <h3 className="text-lg md:text-xl font-display font-semibold text-white">
            {title}
          </h3>
        </div>
        <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1 self-start sm:self-auto">
          {rangeButtons.map((btn) => (
            <button
              key={btn.key}
              type="button"
              onClick={() => setRange(btn.key)}
              className={`rounded-lg px-3 py-1.5 text-xs md:text-sm font-medium transition ${
                range === btn.key
                  ? "bg-brand-primary text-black"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {range === "custom" ? (
        <div className="mb-3 md:mb-4 flex flex-wrap items-center gap-2 text-xs md:text-sm text-slate-400">
          <label className="flex items-center gap-1.5">
            {t(locale, "rangeStart")}
            <input
              type="date"
              value={customStart}
              max={customEnd || todayStr}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-200 [color-scheme:dark]"
            />
          </label>
          <label className="flex items-center gap-1.5">
            {t(locale, "rangeEnd")}
            <input
              type="date"
              value={customEnd}
              min={customStart || undefined}
              max={todayStr}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-slate-200 [color-scheme:dark]"
            />
          </label>
        </div>
      ) : null}

      <div className="h-48 md:h-64 w-full">
        {dailyPoints.length ? (
          <Line data={data} options={options} />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-2xl text-xs md:text-sm text-slate-400">
            {t(locale, "noDataInRange")}
          </div>
        )}
      </div>
    </div>
  );
}
