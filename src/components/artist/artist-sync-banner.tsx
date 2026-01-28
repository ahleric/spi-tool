"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ArtistSyncBannerProps = {
  artistId: string;
  showBanner: boolean;
};

export function ArtistSyncBanner({ artistId, showBanner }: ArtistSyncBannerProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (!showBanner) {
    return null;
  }

  const isBusy = status === "loading" || isPending;

  useEffect(() => {
    if (status !== "loading") {
      return;
    }

    let current = 0;
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      if (elapsed < 8000) {
        current = Math.min(70, current + 4);
      } else if (elapsed < 12000) {
        current = Math.min(90, current + 2);
      } else {
        current = Math.min(95, current + 1);
      }
      setProgress((prev) => Math.max(prev, current));
    }, 400);

    return () => {
      clearInterval(timer);
    };
  }, [status]);

  const handleSync = async () => {
    try {
      setStatus("loading");
      setMessage("");
      setProgress(5);
      const response = await fetch("/api/artist/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Sync failed");
      }
      setProgress(100);
      setStatus("success");
      setMessage("同步完成，正在刷新…");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Sync failed");
      setProgress(100);
    }
  };

  const statusText =
    status === "success"
      ? message || "同步完成"
      : status === "error"
      ? message || "同步失败，请稍后重试。"
      : "该艺人尚未导入数据，通常 10 秒左右即可完成。";

  const stepIndex =
    status === "success" ? 3 : status === "loading" ? (progress < 35 ? 1 : progress < 85 ? 2 : 3) : 0;

  return (
    <div className="rounded-2xl border border-amber-300/50 bg-amber-300/10 px-4 py-4 text-sm text-amber-100">
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-amber-50">这位艺人还没有数据</p>
        <p className="text-xs text-amber-100/80">{statusText}</p>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-amber-100/80">
        <StepLine active={stepIndex >= 1} label="准备同步" />
        <StepLine active={stepIndex >= 2} label="拉取 Spotify 数据" />
        <StepLine active={stepIndex >= 3} label="完成并刷新页面" />
      </div>

      <div className="mt-3" aria-live="polite">
        <div className="h-2 w-full overflow-hidden rounded-full bg-amber-200/20">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              status === "error" ? "bg-rose-400/80" : "bg-amber-200"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-[11px] text-amber-100/70">
          <span>{status === "loading" ? "预计 10 秒左右完成" : status === "success" ? "同步完成" : ""}</span>
          <span>{status === "loading" ? `${progress}%` : ""}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSync}
        disabled={isBusy}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-200 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/70 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isBusy && (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
        )}
        {isBusy ? "正在导入…" : "开始导入艺人数据"}
      </button>

      {status === "error" ? (
        <p className="mt-2 text-xs text-rose-200">{message || "同步失败，请稍后重试。"}</p>
      ) : null}
    </div>
  );
}

function StepLine({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
          active ? "border-amber-200 bg-amber-200 text-slate-900" : "border-amber-200/30 text-amber-200/40"
        }`}
      >
        {active ? "✓" : ""}
      </span>
      <span className={active ? "text-amber-100" : "text-amber-100/60"}>{label}</span>
    </div>
  );
}



