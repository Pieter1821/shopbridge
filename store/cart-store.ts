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
};

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalCents: () => number;
  itemCount: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (cartItem) => cartItem.productId === item.productId,
          );

          if (existing) {
            return {
              items: state.items.map((cartItem) =>
                cartItem.productId === item.productId
                  ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
                  : cartItem,
              ),
            };
          }

          return { items: [...state.items, item] };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        })),
      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.productId === productId
              ? { ...item, quantity: Math.max(1, quantity) }
              : item,
          ),
        })),
      clearCart: () => set({ items: [] }),
      totalCents: () =>
        get().items.reduce(
          (sum, item) => sum + item.priceCents * item.quantity,
          0,
        ),
      itemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "shopbridge-cart",
    },
  ),
);
