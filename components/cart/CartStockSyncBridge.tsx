"use client";

import { useCartStockSync } from "@/hooks/use-cart-stock-sync";

export function CartStockSyncBridge() {
  useCartStockSync(true);
  return null;
}
