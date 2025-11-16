"use client";

type Step = { label: string; count: number };

export function FunnelChart({ steps, small }: { steps: Step[]; small?: boolean }) {
  const max = Math.max(1, ...steps.map((s) => s.count));
  return (
    <div className={`space-y-2 ${small ? "text-xs" : "text-sm"}`}>
      {steps.map((s, idx) => {
        const width = Math.max(6, Math.round((s.count / max) * 100));
        const opacity = 0.3 + 0.7 * ((steps.length - idx) / steps.length);
        return (
          <div key={s.label} className="flex items-center gap-3">
            <div className="w-24 shrink-0 text-slate-300">{s.label}</div>
            <div className="flex-1">
              <div
                className="h-4 rounded-r-xl bg-brand-primary"
                style={{ width: `${width}%`, opacity }}
                title={`${s.label}: ${s.count}`}
              />
            </div>
            <div className="w-16 shrink-0 text-right text-slate-300">{s.count}</div>
          </div>
        );
      })}
    </div>
  );
}

