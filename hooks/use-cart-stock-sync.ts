"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart-store";

export function useCartStockSync(enabled = true) {
  const items = useCartStore((state) => state.items);
  const syncStock = useCartStore((state) => state.syncStock);

  useEffect(() => {
    if (!enabled || items.length === 0) {
      return;
    }

    const productIds = [...new Set(items.map((item) => item.productId))];
    const supabase = createClient();
    let isActive = true;

    async function refreshLiveStock() {
      const { data, error } = await supabase
        .from("products")
        .select("id, stock_quantity")
        .in("id", productIds);

      if (error) {
        console.error("Failed to sync live stock", error.message);
        return;
      }

      if (!isActive) {
        return;
      }

      for (const product of data ?? []) {
        syncStock(product.id, product.stock_quantity ?? 0);
      }
    }

    void refreshLiveStock();

    const activeIds = new Set(productIds);
    const channel = supabase
      .channel(`cart-stock:${productIds.join(",")}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
        },
        (payload) => {
          const next = payload.new as { id?: string; stock_quantity?: number };

          if (next.id && activeIds.has(next.id)) {
            syncStock(next.id, Number(next.stock_quantity ?? 0));
          }
        },
      )
      .subscribe();

    return () => {
      isActive = false;
      void supabase.removeChannel(channel);
    };
  }, [enabled, items, syncStock]);
}
