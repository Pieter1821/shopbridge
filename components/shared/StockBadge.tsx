import { cn } from "@/lib/utils";

const DEFAULT_LOW_STOCK_THRESHOLD = 5;

type StockBadgeProps = {
  stock: number;
  lowStockThreshold?: number | null;
};

export function StockBadge({ stock, lowStockThreshold }: StockBadgeProps) {
  const threshold = typeof lowStockThreshold === "number" && lowStockThreshold > 0
    ? lowStockThreshold
    : DEFAULT_LOW_STOCK_THRESHOLD;
  const isLowStock = stock > 0 && stock <= threshold;
  const label = stock === 0 ? "Out of stock" : isLowStock ? `Only ${stock} left` : `${stock} in stock`;

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
        stock === 0 && "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
        isLowStock && "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300",
        stock > threshold && "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300",
      )}
    >
      {label}
    </span>
  );
}
