"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

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
  const subtotal = useCartStore((state) => state.totalCents());
  const vat = calculateVatCents(subtotal);
  const total = calculateTotalIncludingVatCents(subtotal);
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Loading cart...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-950">Your cart is empty</h2>
        <p className="mt-2 text-sm text-slate-600">
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
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.brand}</p>
                <h2 className="text-lg font-semibold text-slate-950">{item.name}</h2>
                <p className="text-sm text-slate-600">{formatZAR(item.priceCents)} each</p>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(event) =>
                    updateQuantity(item.productId, Number(event.target.value) || 1)
                  }
                  className="w-20 rounded-full border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Order summary</h2>
        <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
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
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-base font-semibold text-slate-950">
          <span>Total</span>
          <span>{formatZAR(total)}</span>
        </div>

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
            className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700"
          >
            Clear cart
          </button>
        </div>
      </aside>
    </div>
  );
}
