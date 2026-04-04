"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { useCartStockSync } from "@/hooks/use-cart-stock-sync";
import {
  calculateTotalIncludingVatCents,
  calculateVatCents,
  formatZAR,
} from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

function useHydrated() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

export function CartSummary() {
  const items = useCartStore((state) => state.items);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const stockNotice = useCartStore((state) => state.stockNotice);
  const subtotal = useCartStore((state) => state.totalCents());
  const vat = calculateVatCents(subtotal);
  const total = calculateTotalIncludingVatCents(subtotal);
  const hydrated = useHydrated();

  useCartStockSync(hydrated);

  if (!hydrated) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
        Loading cart...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Your cart is empty</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Browse the catalogue and add something you love to get started.
        </p>
        <Link
          href="/products"
          className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.productId}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{item.brand}</p>
                <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{item.name}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">{formatZAR(item.priceCents)} each</p>
                {typeof item.stockQuantity === "number" ? (
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                    {item.stockQuantity === 0
                      ? "Currently sold out"
                      : `Live stock: ${item.stockQuantity} available`}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={item.stockQuantity ?? undefined}
                  value={item.quantity}
                  onChange={(event) =>
                    updateQuantity(item.productId, Number(event.target.value) || 1)
                  }
                  className="w-20 rounded-full border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-200"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Order summary</h2>
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
          <span>Subtotal</span>
          <span>{formatZAR(subtotal)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
          <span>VAT (15%)</span>
          <span>{formatZAR(vat)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
          <span>Shipping</span>
          <span>Calculated at checkout</span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-base font-semibold text-slate-950 dark:border-slate-700 dark:text-white">
          <span>Total</span>
          <span>{formatZAR(total)}</span>
        </div>

        {stockNotice ? (
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            {stockNotice}
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          <Link
            href="/checkout"
            className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Continue to checkout
          </Link>
          <button
            type="button"
            onClick={clearCart}
            className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:text-slate-200"
          >
            Clear cart
          </button>
        </div>
      </aside>
    </div>
  );
}
