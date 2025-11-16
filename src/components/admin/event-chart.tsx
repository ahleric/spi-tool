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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
);

type Props = {
  timeline: Record<string, number>;
};

export function EventChart({ timeline }: Props) {
  const labels = Object.keys(timeline).sort();
  const values = labels.map((label) => timeline[label]);

  const data = {
    labels,
    datasets: [
      {
        label: "Events per Day",
        data: values,
        borderColor: "#1DB954",
        backgroundColor: "rgba(29, 185, 84, 0.16)",
        fill: true,
        tension: 0.4,
        pointRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: { color: "#94a3b8" },
        grid: { color: "rgba(148,163,184,0.1)" },
      },
      y: {
        ticks: { color: "#94a3b8", stepSize: 1 },
        grid: { color: "rgba(148,163,184,0.1)" },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="glass rounded-3xl p-6">
      <div className="mb-4">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
          Event Timeline
        </p>
        <h3 className="text-xl font-display font-semibold text-white">
          每日事件趋势
        </h3>
      </div>
      <div className="h-64">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
