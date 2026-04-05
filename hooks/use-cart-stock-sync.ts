"use client";

import { useEffect, useMemo, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cart-store";

export function useCartStockSync(enabled = true) {
  const items = useCartStore((state) => state.items);
  const syncStock = useCartStore((state) => state.syncStock);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const productIdsKey = useMemo(
    () => [...new Set(items.map((item) => item.productId))].sort().join(","),
    [items],
  );

  useEffect(() => {
    const supabase = createClient();

    async function removeExistingChannel() {
      if (!channelRef.current) {
        return;
      }

      const existingChannel = channelRef.current;
      channelRef.current = null;
      await supabase.removeChannel(existingChannel).catch(() => undefined);
    }

    if (!enabled || !productIdsKey) {
      void removeExistingChannel();
      return;
    }

    const productIds = productIdsKey.split(",").filter(Boolean);
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

    void (async () => {
      await removeExistingChannel();

      if (!isActive) {
        return;
      }

      await refreshLiveStock();

      if (!isActive) {
        return;
      }

      const activeIds = new Set(productIds);
      const channel = supabase
        .channel(`cart-stock:${productIdsKey}:${Date.now()}`)
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

      channelRef.current = channel;
    })();

    return () => {
      isActive = false;
      void removeExistingChannel();
    };
  }, [enabled, productIdsKey, syncStock]);
}
