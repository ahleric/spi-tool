"use client";

import { type ReactNode } from "react";

type ErrorBlockProps = {
  title: string;
  message?: string;
  onRetry?: () => void;
  children?: ReactNode;
};

export function ErrorBlock({ title, message, onRetry, children }: ErrorBlockProps) {
  return (
    <div className="rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-6 text-center">
      <h3 className="text-lg font-semibold text-rose-900 dark:text-rose-300">
        {title}
      </h3>
      {message && (
        <p className="mt-2 text-sm text-rose-700 dark:text-rose-400">{message}</p>
      )}
      {children}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
        >
          Retry
        </button>
      )}
    </div>
  );
}

