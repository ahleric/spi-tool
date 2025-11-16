"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ArtistSyncBannerProps = {
  artistId: string;
  showBanner: boolean;
};

export function ArtistSyncBanner({ artistId, showBanner }: ArtistSyncBannerProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!showBanner) {
    return null;
  }

  const isBusy = status === "loading" || isPending;

  const handleSync = async () => {
    const confirmed = window.confirm(
      "将向 Spotify 请求最新数据，这可能需要 10–30 秒时间，期间请不要频繁重复点击。确定要开始同步吗？"
    );
    if (!confirmed) return;

    try {
      setStatus("loading");
      setMessage("");
      const response = await fetch("/api/artist/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Sync failed");
      }
      setStatus("success");
      setMessage("同步完成，正在刷新…");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Sync failed");
    }
  };

  const statusText =
    status === "success"
      ? message || "同步完成"
      : status === "error"
      ? message || "同步失败，请稍后重试。"
      : "艺人数据仍在同步中，这可能需要一些时间（通常 10–30 秒）。你也可以手动触发同步。";

  return (
    <div className="rounded-2xl border border-amber-300/50 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
      <p className="mb-2">{statusText}</p>
      <button
        type="button"
        onClick={handleSync}
        disabled={isBusy}
        className="rounded-xl bg-amber-200/80 px-4 py-2 text-slate-900 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isBusy && (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
        )}
        {isBusy ? "同步中…" : "手动同步艺人数据"}
      </button>
    </div>
  );
}




