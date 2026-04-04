"use client";

import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { useCartStore } from "@/store/cart-store";

function useHydrated() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

export function CartIndicator() {
  const count = useCartStore((state) => state.itemCount());
  const hydrated = useHydrated();

  return (
    <Link
      href="/cart"
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
    >
      <ShoppingCart className="h-4 w-4" />
      Cart
      <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-white dark:bg-emerald-600">
        {hydrated ? count : 0}
      </span>
    </Link>
  );
}
