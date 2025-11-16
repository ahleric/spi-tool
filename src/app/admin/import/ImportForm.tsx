"use client";

import { useState } from "react";

export default function ImportForm() {
  const [inputs, setInputs] = useState("");
  const [snapshotNow, setSnapshotNow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const lines = inputs
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      if (!lines.length) {
        setError("请输入至少一个链接/ID");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/admin/seed-ui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: lines, snapshotNow }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "导入失败");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "导入失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <textarea
        className="w-full h-40 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
        placeholder="https://open.spotify.com/artist/..., spotify:artist:..., 或艺人ID，每行一个"
        value={inputs}
        onChange={(e) => setInputs(e.target.value)}
      />
      <label className="flex items-center gap-2 text-sm text-slate-200">
        <input
          type="checkbox"
          checked={snapshotNow}
          onChange={(e) => setSnapshotNow(e.target.checked)}
        />
        立即完整入库（较慢，调用 Spotify 多次）
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-2xl bg-brand-primary/90 px-4 py-2 font-semibold text-slate-900 hover:bg-brand-primary disabled:opacity-50"
      >
        {loading ? "提交中..." : "开始导入"}
      </button>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      {result && (
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-slate-200">
            总数：{result.summary?.total} · 成功：{result.summary?.success} ·
            失败：{result.summary?.failed}
          </p>
          <div className="mt-3 space-y-2 text-sm">
            {(result.results || []).map((r: any, idx: number) => (
              <div
                key={idx}
                className="rounded-xl border border-white/10 p-2 text-slate-200"
              >
                {r.ok ? "✅" : "❌"} {r.input} {r.kind ? `(${r.kind})` : ""}{" "}
                {r.id ? `→ ${r.id}` : ""} {r.error ? `· ${r.error}` : ""}
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}

