"use client";

import { Loader2, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ProductGrid } from "@/components/products/ProductGrid";
import type { StorefrontProduct } from "@/lib/shop";

type RealtimeSearchExperienceProps = {
  initialQuery: string;
  initialResults: StorefrontProduct[];
};

export function RealtimeSearchExperience({
  initialQuery,
  initialResults,
}: RealtimeSearchExperienceProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(initialResults);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const skipNextFetchRef = useRef(true);

  useEffect(() => {
    setQuery(initialQuery);
    setResults(initialResults);
    skipNextFetchRef.current = true;
  }, [initialQuery, initialResults]);

  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    const controller = new AbortController();
    const trimmed = query.trim();

    const timeout = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=18`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Live search is unavailable right now.");
        }

        const payload = (await response.json()) as { results?: StorefrontProduct[] };
        setResults(payload.results ?? []);
        window.history.replaceState(
          window.history.state,
          "",
          trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search",
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Live search is unavailable right now.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  return (
    <>
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400">
              Search
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              Search results{query.trim() ? ` for “${query.trim()}”` : ""}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Results update instantly while you type — no more full page reloads.
            </p>
          </div>

          <p aria-live="polite" className="text-sm text-slate-500 dark:text-slate-400">
            {isLoading
              ? "Searching live…"
              : `${results.length} product${results.length === 1 ? "" : "s"} found`}
          </p>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products, brands, or tags"
              className="w-full rounded-full border border-slate-300 bg-white px-11 py-3 pr-11 text-sm text-slate-900 outline-none transition focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="inline-flex min-w-36 items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white dark:bg-emerald-600">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Live search"}
          </div>
        </div>
      </section>

      <div className="mt-6">
        {errorMessage ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
            {errorMessage}
          </div>
        ) : results.length > 0 ? (
          <ProductGrid products={results} />
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            No live products matched {query.trim() ? `“${query.trim()}”` : "that search"}.
          </div>
        )}
      </div>
    </>
  );
}
