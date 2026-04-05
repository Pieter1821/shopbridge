"use client";

import { StockBadge } from "@/components/shared/StockBadge";
import { useCartStore } from "@/store/cart-store";

type ProductAvailabilityBadgeProps = {
  productId: string;
  stock: number;
  lowStockThreshold?: number | null;
};

export function ProductAvailabilityBadge({
  productId,
  stock,
  lowStockThreshold,
}: ProductAvailabilityBadgeProps) {
  const cartItem = useCartStore((state) =>
    state.items.find((item) => item.productId === productId),
  );

  const liveStock =
    typeof cartItem?.stockQuantity === "number" ? Math.max(0, cartItem.stockQuantity) : Math.max(0, stock);
  const reservedQuantity = Math.max(0, cartItem?.quantity ?? 0);
  const availableStock = Math.max(0, liveStock - reservedQuantity);

  return (
    <StockBadge
      stock={availableStock}
      lowStockThreshold={lowStockThreshold}
    />
  );
}
