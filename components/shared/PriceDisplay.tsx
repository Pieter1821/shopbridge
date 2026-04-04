import { formatZAR } from "@/lib/utils";

type PriceDisplayProps = {
  priceCents: number;
  compareAtPriceCents?: number;
  className?: string;
};

export function PriceDisplay({
  priceCents,
  compareAtPriceCents,
  className,
}: PriceDisplayProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-slate-950 dark:text-white">
          {formatZAR(priceCents)}
        </span>
        {compareAtPriceCents ? (
          <span className="text-sm text-slate-400 line-through dark:text-slate-300">
            {formatZAR(compareAtPriceCents)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
