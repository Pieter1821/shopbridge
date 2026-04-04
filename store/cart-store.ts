"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  priceCents: number;
  quantity: number;
  stockQuantity?: number | null;
};

type CartStore = {
  items: CartItem[];
  stockNotice: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  syncStock: (productId: string, stockQuantity: number) => void;
  clearCart: () => void;
  clearStockNotice: () => void;
  totalCents: () => number;
  itemCount: () => number;
};

function normalizeStockQuantity(stockQuantity?: number | null) {
  return typeof stockQuantity === "number" && Number.isFinite(stockQuantity)
    ? Math.max(0, stockQuantity)
    : null;
}

function clampQuantity(quantity: number, stockQuantity?: number | null) {
  const safeStock = normalizeStockQuantity(stockQuantity);

  if (safeStock === null) {
    return Math.max(1, quantity);
  }

  if (safeStock === 0) {
    return 0;
  }

  return Math.min(Math.max(1, quantity), safeStock);
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      stockNotice: null,
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (cartItem) => cartItem.productId === item.productId,
          );
          const desiredQuantity = (existing?.quantity ?? 0) + item.quantity;
          const nextQuantity = clampQuantity(desiredQuantity, item.stockQuantity ?? existing?.stockQuantity);

          if (nextQuantity === 0) {
            return {
              items: state.items.filter((cartItem) => cartItem.productId !== item.productId),
              stockNotice: `${item.name} is currently sold out and was removed from your cart.`,
            };
          }

          if (existing) {
            return {
              items: state.items.map((cartItem) =>
                cartItem.productId === item.productId
                  ? {
                      ...cartItem,
                      stockQuantity: item.stockQuantity ?? cartItem.stockQuantity ?? null,
                      quantity: nextQuantity,
                    }
                  : cartItem,
              ),
              stockNotice:
                nextQuantity < desiredQuantity
                  ? `Cart updated to the live stock available for ${item.name}.`
                  : null,
            };
          }

          return {
            items: [
              ...state.items,
              {
                ...item,
                quantity: nextQuantity,
                stockQuantity: item.stockQuantity ?? null,
              },
            ],
            stockNotice:
              nextQuantity < item.quantity
                ? `Only ${nextQuantity} unit${nextQuantity === 1 ? "" : "s"} of ${item.name} are available right now.`
                : null,
          };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
          stockNotice: null,
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => {
          const currentItem = state.items.find((item) => item.productId === productId);

          if (!currentItem) {
            return state;
          }

          const nextQuantity = clampQuantity(quantity, currentItem.stockQuantity);

          if (nextQuantity === 0) {
            return {
              items: state.items.filter((item) => item.productId !== productId),
              stockNotice: `${currentItem.name} is now sold out and was removed from your cart.`,
            };
          }

          return {
            items: state.items.map((item) =>
              item.productId === productId
                ? { ...item, quantity: nextQuantity }
                : item,
            ),
            stockNotice:
              nextQuantity < Math.max(1, quantity)
                ? `Quantity updated to match the live stock for ${currentItem.name}.`
                : null,
          };
        }),
      syncStock: (productId, stockQuantity) =>
        set((state) => {
          const currentItem = state.items.find((item) => item.productId === productId);

          if (!currentItem) {
            return state;
          }

          const nextQuantity = clampQuantity(currentItem.quantity, stockQuantity);

          if (nextQuantity === currentItem.quantity && currentItem.stockQuantity === stockQuantity) {
            return state;
          }

          if (nextQuantity === 0) {
            return {
              items: state.items.filter((item) => item.productId !== productId),
              stockNotice: `${currentItem.name} sold out and was removed from your cart.`,
            };
          }

          return {
            items: state.items.map((item) =>
              item.productId === productId
                ? { ...item, quantity: nextQuantity, stockQuantity }
                : item,
            ),
            stockNotice:
              nextQuantity < currentItem.quantity
                ? `Cart updated in real time for ${currentItem.name} — only ${stockQuantity} left.`
                : null,
          };
        }),
      clearCart: () => set({ items: [], stockNotice: null }),
      clearStockNotice: () => set({ stockNotice: null }),
      totalCents: () =>
        get().items.reduce(
          (sum, item) => sum + item.priceCents * item.quantity,
          0,
        ),
      itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "shopbridge-cart",
      partialize: (state) => ({ items: state.items }),
    },
  ),
);
