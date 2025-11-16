"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

type Props = {
  artists: Array<{ artistId: string; artistName: string; count: number }>;
};

export function TopArtistsChart({ artists }: Props) {
  if (!artists.length) {
    return (
      <div className="glass flex h-64 w-full items-center justify-center rounded-3xl text-sm text-slate-400">
        暂无数据
      </div>
    );
  }

  const labels = artists.map((a) => a.artistName).slice(0, 10);
  const values = artists.map((a) => a.count).slice(0, 10);

  const data = {
    labels,
    datasets: [
      {
        label: "查询次数",
        data: values,
        backgroundColor: "rgba(34, 211, 238, 0.8)",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: { color: "#94a3b8", stepSize: 1 },
        grid: { color: "rgba(148,163,184,0.1)" },
        beginAtZero: true,
      },
      y: {
        ticks: { color: "#94a3b8" },
        grid: { display: false },
      },
    },
  };

  return (
    <div className="glass rounded-3xl p-6">
      <div className="mb-4">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
          Top Artists
        </p>
        <h3 className="text-xl font-display font-semibold text-white">
          查询最多的艺人
        </h3>
      </div>
      <div className="h-64">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}


