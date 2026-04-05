"use client";

import { Loader2, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { ProductAvailabilityBadge } from "@/components/shared/ProductAvailabilityBadge";
import type { StorefrontProduct } from "@/lib/shop";
import { cn, formatZAR } from "@/lib/utils";

type LiveSearchBoxProps = {
  mobile?: boolean;
  onNavigate?: () => void;
};

export function LiveSearchBox({ mobile = false, onNavigate }: LiveSearchBoxProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StorefrontProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (pathname === "/search") {
      const params = new URLSearchParams(window.location.search);
      setQuery(params.get("q") ?? "");
      return;
    }

    setQuery("");
  }, [pathname]);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}&limit=6`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Search suggestions are unavailable right now.");
        }

        const payload = (await response.json()) as { results?: StorefrontProduct[] };
        setResults(payload.results ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  function goTo(url: string) {
    setIsOpen(false);
    onNavigate?.();
    router.push(url);
  }

  function viewAllResults() {
    const trimmed = query.trim();
    goTo(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    viewAllResults();
  }

  return (
    <div className={cn("relative", mobile ? "w-full" : "hidden xl:block") }>
      <form
        onSubmit={handleSubmit}
        className={cn(
          "flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/90 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/90",
          mobile && "w-full",
        )}
      >
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 120);
          }}
          name="q"
          type="search"
          placeholder="Search products"
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
          aria-label="Search products"
        />
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-emerald-500" /> : null}
      </form>

      {isOpen && query.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
          <div className="border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Live results
          </div>

          {results.length > 0 ? (
            <div className="max-h-96 overflow-y-auto p-2">
              {results.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => goTo(`/products/${product.slug}`)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900",
                    product.stock_quantity === 0 && "bg-red-50/60 dark:bg-red-950/10",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {product.name}
                    </p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                      {product.brand ?? product.category?.name ?? "ShopBridge"}
                    </p>
                    <div className="mt-2">
                      <ProductAvailabilityBadge
                        productId={product.id}
                        stock={product.stock_quantity}
                        lowStockThreshold={product.low_stock_threshold}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    {formatZAR(product.price_cents)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-5 text-sm text-slate-500 dark:text-slate-400">
              No matches yet. Try another name, brand, or keyword.
            </div>
          )}

          <div className="border-t border-slate-200 p-2 dark:border-slate-800">
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={viewAllResults}
              className="w-full rounded-2xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              View all results
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
