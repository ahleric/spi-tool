"use client";

import { useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";

type Props = {
  page: number;
  totalPages: number;
};

export function Pagination({ page, totalPages }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) {
    return null;
  }

  const handleChange = (nextPage: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("page", String(nextPage));
    router.push(`?${params.toString()}`);
  };

  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  const pages = Array.from({ length: end - start + 1 }, (_, index) => start + index);

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300 disabled:opacity-40"
        disabled={page === 1}
        onClick={() => handleChange(page - 1)}
      >
        上一页
      </button>
      {pages.map((item) => (
        <button
          key={item}
          onClick={() => handleChange(item)}
          className={clsx(
            "rounded-full px-3 py-1 text-sm transition",
            item === page
              ? "bg-brand-primary text-slate-900"
              : "border border-white/10 text-slate-300 hover:text-white",
          )}
        >
          {item}
        </button>
      ))}
      <button
        className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300 disabled:opacity-40"
        disabled={page === totalPages}
        onClick={() => handleChange(page + 1)}
      >
        下一页
      </button>
    </div>
  );
}
