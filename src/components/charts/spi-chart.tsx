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
import { useEffect, useState } from "react";

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

export function SpiChart({ points, title }: Props) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    setLocale(getLocaleClient());
  }, []);

  if (!points?.length) {
    return (
      <div className="glass flex h-48 md:h-64 w-full items-center justify-center rounded-2xl text-xs md:text-sm text-slate-400">
        {t(locale, "noHistoryData")}
      </div>
    );
  }

  const labels = points.map((point) => dayjs(point.capturedAt).format("MM/DD"));

  const data = {
    labels,
    datasets: [
      {
        label: locale === "zh" ? "流行指数" : "Popularity",
        data: points.map((point) => point.spi),
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

  return (
    <div className="glass rounded-2xl md:rounded-3xl p-4 md:p-6">
      <div className="mb-3 md:mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs md:text-sm uppercase tracking-widest text-slate-400">
            {t(locale, "spiTrend")}
          </p>
          <h3 className="text-lg md:text-xl font-display font-semibold text-white">
            {title}
          </h3>
        </div>
      </div>
      <div className="h-48 md:h-64 w-full">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
