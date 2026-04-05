"use client";

import { ShoppingBag } from "lucide-react";
import { useState } from "react";

import type { StorefrontProduct } from "@/lib/shop";
import { useCartStore } from "@/store/cart-store";

export function AddToCartButton({ product }: { product: StorefrontProduct }) {
  const addItem = useCartStore((state) => state.addItem);
  const cartItem = useCartStore((state) =>
    state.items.find((item) => item.productId === product.id),
  );
  const cartQuantity = cartItem?.quantity ?? 0;
  const [added, setAdded] = useState(false);
  const liveStock =
    typeof cartItem?.stockQuantity === "number"
      ? Math.max(0, cartItem.stockQuantity)
      : Math.max(0, product.stock_quantity);
  const availableStock = Math.max(0, liveStock - cartQuantity);
  const isSoldOut = availableStock === 0;
  const hasReachedStockLimit = cartQuantity > 0 && availableStock === 0 && product.stock_quantity > 0;

  return (
    <button
      type="button"
      disabled={isSoldOut || hasReachedStockLimit}
      onClick={() => {
        addItem({
          productId: product.id,
          slug: product.slug,
          name: product.name,
          brand: product.brand ?? "ShopBridge",
          priceCents: product.price_cents,
          quantity: 1,
          stockQuantity: liveStock,
        });

        setAdded(true);
        window.setTimeout(() => setAdded(false), 1200);
      }}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
    >
      <ShoppingBag className="h-4 w-4" />
      {isSoldOut
        ? hasReachedStockLimit
          ? "All stock in cart"
          : "Currently sold out"
        : added
          ? "Added to cart"
          : "Add to cart"}
    </button>
  );
}
