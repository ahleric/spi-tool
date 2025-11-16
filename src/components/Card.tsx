import { cn } from "@/lib/ui";
import { type ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
  onClick?: () => void;
  href?: string;
};

export function Card({ children, className, asChild, onClick, href }: CardProps) {
  const baseClasses =
    "rounded-2xl border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition";

  if (asChild && href) {
    return (
      <a
        href={href}
        className={cn(baseClasses, "block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-500", className)}
      >
        {children}
      </a>
    );
  }

  if (onClick || href) {
    const Component = href ? "a" : "button";
    return (
      <Component
        href={href}
        onClick={onClick}
        className={cn(
          baseClasses,
          "block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-500",
          className
        )}
      >
        {children}
      </Component>
    );
  }

  return <div className={cn(baseClasses, className)}>{children}</div>;
}

