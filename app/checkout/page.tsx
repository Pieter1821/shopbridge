"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import {
  calculateTotalIncludingVatCents,
  calculateVatCents,
  formatZAR,
} from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

const deliveryOptions = [
  "Standard delivery · 2–4 business days",
  "Express delivery · 1–2 business days",
  "Cape Town same-day courier on selected drops",
];

function useHydrated() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

export default function CheckoutPage() {
  const subtotal = useCartStore((state) => state.totalCents());
  const itemCount = useCartStore((state) => state.itemCount());
  const hydrated = useHydrated();
  const vat = calculateVatCents(subtotal);
  const total = calculateTotalIncludingVatCents(subtotal);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
          Checkout
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          Fast, secure, and ready for payment
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Contact details</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input className="rounded-full border border-slate-300 px-4 py-3 text-sm" placeholder="First name" />
              <input className="rounded-full border border-slate-300 px-4 py-3 text-sm" placeholder="Last name" />
              <input className="sm:col-span-2 rounded-full border border-slate-300 px-4 py-3 text-sm" placeholder="Email address" />
              <input className="sm:col-span-2 rounded-full border border-slate-300 px-4 py-3 text-sm" placeholder="Mobile number" />
            </div>
          </section>

          <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Delivery address</h2>
            <div className="mt-4 grid gap-3">
              <input className="rounded-full border border-slate-300 px-4 py-3 text-sm" placeholder="Street address" />
              <input className="rounded-full border border-slate-300 px-4 py-3 text-sm" placeholder="Apartment, suite, etc. (optional)" />
              <div className="grid gap-3 sm:grid-cols-3">
                <input className="rounded-full border border-slate-300 px-4 py-3 text-sm" placeholder="City" />
                <input className="rounded-full border border-slate-300 px-4 py-3 text-sm" placeholder="Province" />
                <input className="rounded-full border border-slate-300 px-4 py-3 text-sm" placeholder="Postal code" />
              </div>
            </div>
          </section>

          <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Delivery method</h2>
            <div className="mt-4 space-y-3">
              {deliveryOptions.map((option) => (
                <label key={option} className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  <input type="radio" name="delivery" className="h-4 w-4" />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Order summary</h2>
          <p className="mt-1 text-sm text-slate-500">
            {hydrated ? `${itemCount} item${itemCount === 1 ? "" : "s"} in your cart` : "Loading your cart..."}
          </p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{hydrated ? formatZAR(subtotal) : "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>VAT (15%)</span>
              <span>{hydrated ? formatZAR(vat) : "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Delivery</span>
              <span>Selected at checkout</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 font-semibold text-slate-950">
              <span>Total</span>
              <span>{hydrated ? formatZAR(total) : "—"}</span>
            </div>
          </div>

          {hydrated && itemCount === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              Your cart is empty. Add a few products before checkout.
              <Link href="/products" className="mt-3 inline-flex font-semibold text-slate-950 underline underline-offset-4">
                Browse products
              </Link>
            </div>
          ) : null}

          <button
            disabled={!hydrated || itemCount === 0}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue to payment
          </button>
        </aside>
      </div>
    </div>
  );
}
