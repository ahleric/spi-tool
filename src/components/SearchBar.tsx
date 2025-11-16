"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/ui";
import { useTopLoader } from "@/components/top-loader";

type SearchBarProps = {
  className?: string;
};

export function SearchBar({ className }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const topLoader = useTopLoader();
  const isBusy = loading || isPending;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = query.trim();
    if (!input) {
      setError("Please enter an artist or track.");
      return;
    }

    setError(null);
    setLoading(true);
    topLoader.show();

    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const res = await fetch(`/api/resolve?q=${encodeURIComponent(input)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is JSON before parsing
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", res.status, text.slice(0, 200));
        throw new Error(
          `Server error (${res.status}): ${text.slice(0, 120)}${text.length > 120 ? "..." : ""}`
        );
      }

      const data = await res.json();
      console.log("API response:", data);

      if (!res.ok || !data?.ok) {
        // Provide user-friendly error messages
        let errorMsg = data?.error || `Resolve failed with status ${res.status}`;
        if (res.status === 429) {
          errorMsg = "Search service is temporarily busy. Please try again in a moment.";
        } else if (res.status >= 500) {
          errorMsg = "Server error. Please try again later.";
        } else if (res.status === 404) {
          errorMsg = "No results found. Please try a different search term.";
        }
        console.error("API error:", errorMsg);
        throw new Error(errorMsg);
      }

      if (!data.kind || !data.id) {
        console.error("Invalid API response:", data);
        throw new Error("Invalid response from server.");
      }

      let destination: string | null = null;
      if (data.kind === "artist") {
        destination = `/artist/${data.id}`;
      } else if (data.kind === "track") {
        destination = `/track/${data.id}`;
      } else {
        throw new Error(`Unknown kind from API: ${data.kind}`);
      }

      setLoading(false);
      topLoader.hide();
      startTransition(() => {
        if (destination) router.push(destination!);
      });
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Search error:", err);
      
      let errorMessage = "Search failed. Please try again.";
      if (err instanceof Error) {
        if (err.name === "AbortError" || err.message.includes("timeout")) {
          errorMessage = "Request timeout. Please try again.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setLoading(false);
      topLoader.hide();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Artist name or Spotify link"
          disabled={isBusy}
          className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent disabled:opacity-50"
          aria-label="Search for artist or track"
        />
        <button
          type="submit"
          disabled={isBusy}
          className="rounded-xl bg-black dark:bg-white px-6 py-3 text-white dark:text-black font-medium hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-500 disabled:opacity-50 transition"
          aria-label="Search"
        >
          {isBusy ? "Searching..." : "Search"}
        </button>
      </form>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Supports artist name, Spotify profile URL, URI, or ID
      </p>
      {error && (
        <p className="mt-2 text-sm text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
