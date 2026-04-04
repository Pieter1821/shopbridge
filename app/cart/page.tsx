import { CartSummary } from "@/components/cart/CartSummary";

export default function CartPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400">
          Cart
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
          Review your order
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-300">
          Check your items, see the 15% VAT breakdown, and head to secure checkout.
        </p>
      </div>

      <CartSummary />
    </div>
  );
}
