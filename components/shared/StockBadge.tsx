import { cn } from "@/lib/utils";

export function StockBadge({ stock }: { stock: number }) {
  const label = stock === 0 ? "Out of stock" : stock <= 5 ? `Only ${stock} left` : "In stock";

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
        stock === 0 && "border-red-200 bg-red-50 text-red-700",
        stock > 0 && stock <= 5 && "border-amber-200 bg-amber-50 text-amber-700",
        stock > 5 && "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {label}
    </span>
  );
}
