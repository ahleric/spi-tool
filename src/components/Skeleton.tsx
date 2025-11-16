import { cn } from "@/lib/ui";

type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-zinc-200 dark:bg-zinc-800",
        className
      )}
    />
  );
}

