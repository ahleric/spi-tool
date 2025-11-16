import { cn } from "@/lib/ui";

type BadgeSPIProps = {
  value: number;
  className?: string;
};

export function BadgeSPI({ value, className }: BadgeSPIProps) {
  const colorClass =
    value >= 90
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
      : value >= 70
        ? "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300"
        : value >= 40
          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
          : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        colorClass,
        className
      )}
    >
      {value}
    </span>
  );
}

