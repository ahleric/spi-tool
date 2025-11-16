type EventType = string;

type Props = {
  type: EventType;
  count: number;
};

const LABELS: Record<
  string,
  { label: string; description: string; color: string }
> = {
  search: {
    label: "搜索",
    description: "Search",
    color: "bg-sky-500/20 text-sky-200 border-sky-500/40",
  },
  artist_view: {
    label: "艺人页浏览",
    description: "Artist View",
    color: "bg-emerald-500/15 text-emerald-200 border-emerald-500/40",
  },
  track_view: {
    label: "歌曲页浏览",
    description: "Track View",
    color: "bg-violet-500/15 text-violet-200 border-violet-500/40",
  },
  track_open: {
    label: "跳转 Spotify",
    description: "Open on Spotify",
    color: "bg-amber-500/15 text-amber-200 border-amber-500/40",
  },
};

function Icon({ type }: { type: EventType }) {
  const key = type as keyof typeof LABELS;
  switch (key) {
    case "search":
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="6" />
          <line x1="16" y1="16" x2="21" y2="21" />
        </svg>
      );
    case "artist_view":
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c1.5-3 3.5-4.5 7-4.5s5.5 1.5 7 4.5" />
        </svg>
      );
    case "track_view":
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M9 9h6" />
          <path d="M9 13h4" />
        </svg>
      );
    case "track_open":
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 3h7v7" />
          <path d="M10 14L21 3" />
          <rect x="4" y="7" width="9" height="13" rx="2" />
        </svg>
      );
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      );
  }
}

export function EventTypeBadge({ type, count }: Props) {
  const meta = LABELS[type] ?? {
    label: type,
    description: "",
    color: "bg-slate-800/60 text-slate-100 border-white/10",
  };

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-xs md:text-sm ${meta.color}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/30">
          <Icon type={type} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-white">{meta.label}</p>
          {meta.description && (
            <p className="text-[10px] text-slate-300/80">{meta.description}</p>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-white">{count}</p>
      </div>
    </div>
  );
}

