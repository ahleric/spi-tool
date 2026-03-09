"use client";

import { useState } from "react";

export default function ImportForm() {
  const [inputs, setInputs] = useState("");
  const [snapshotNow, setSnapshotNow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    summary?: {
      total?: number;
      success?: number;
      failed?: number;
      artists?: number;
      tracks?: number;
      snapshotNow?: boolean;
    };
    results?: Array<{
      input: string;
      ok: boolean;
      kind?: "artist" | "track";
      id?: string;
      artistId?: string;
      name?: string;
      error?: string;
    }>;
  } | null>(null);
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
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
        <p className="font-semibold">活动前建议先做一次基础预热</p>
        <p className="mt-1 text-emerald-100/80">
          默认只把艺人和歌曲资料拉进本地数据库，速度更快，也更省 Spotify API 配额。
          只有你确定需要现场展示最新走势图时，再勾选下方的完整入库。
        </p>
      </div>
      <textarea
        className="w-full h-40 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
        placeholder="支持艺人名、Spotify 链接、URI 或 ID，每行一个"
        value={inputs}
        onChange={(e) => setInputs(e.target.value)}
      />
      <p className="text-xs text-slate-400">
        适合提前粘贴你活动上会提到的艺人、歌曲和示例链接，避免现场第一次搜索时再临时请求 Spotify。
      </p>
      <label className="flex items-center gap-2 text-sm text-slate-200">
        <input
          type="checkbox"
          checked={snapshotNow}
          onChange={(e) => setSnapshotNow(e.target.checked)}
        />
        同时写入最新快照和走势图起点（较慢，会多调用几次 Spotify）
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-2xl bg-brand-primary/90 px-4 py-2 font-semibold text-slate-900 hover:bg-brand-primary disabled:opacity-50"
      >
        {loading ? "预热中..." : "开始预热"}
      </button>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      {result && (
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-slate-200">
            总数：{result.summary?.total} · 成功：{result.summary?.success} ·
            失败：{result.summary?.failed} · 艺人：{result.summary?.artists} ·
            歌曲：{result.summary?.tracks}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            模式：{result.summary?.snapshotNow ? "完整入库（含快照）" : "基础预热（仅缓存资料）"}
          </p>
          <div className="mt-3 space-y-2 text-sm">
            {(result.results || []).map((r: any, idx: number) => (
              <div
                key={idx}
                className="rounded-xl border border-white/10 p-2 text-slate-200"
              >
                {r.ok ? "✅" : "❌"} {r.name || r.input} {r.kind ? `(${r.kind})` : ""}{" "}
                {r.id ? `→ ${r.id}` : ""} {r.error ? `· ${r.error}` : ""}
              </div>
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
