import { Card, CardContent, Chip } from "@heroui/react";
import Image from "next/image";
import Link from "next/link";

import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { StockBadge } from "@/components/shared/StockBadge";
import type { StorefrontProduct } from "@/lib/shop";

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const coverImage = product.images?.[0];
  const brand = product.brand ?? "ShopBridge";
  const categoryLabel = product.category?.name ?? "Featured";
  const tags = product.tags?.slice(0, 3) ?? [];

  return (
    <Card className="group overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/90 shadow-[0_20px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-32px_rgba(15,23,42,0.5)] dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-[0_24px_60px_-36px_rgba(2,6,23,0.85)]">
      <div className="relative h-56 overflow-hidden bg-slate-100">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 24vw, (min-width: 768px) 33vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 text-sm font-medium text-slate-500">
            Product image coming soon
          </div>
        )}

        <div className="absolute right-3 top-3">
          <Chip className="bg-white/90 text-slate-900 backdrop-blur" size="sm" variant="soft">
            {categoryLabel}
          </Chip>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950/90 via-slate-900/50 to-transparent p-5 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-200">{brand}</p>
          <h3 className="mt-2 line-clamp-2 text-xl font-semibold">{product.name}</h3>
        </div>
      </div>

      <CardContent className="space-y-4 p-5">
        <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
          {product.description ?? "Premium style, clean lines, and everyday comfort."}
        </p>
        {tags.length ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Chip key={tag} className="bg-slate-100 text-slate-700" size="sm" variant="soft">
                {tag}
              </Chip>
            ))}
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <div>
            <PriceDisplay
              priceCents={product.price_cents}
              compareAtPriceCents={product.compare_at_price_cents ?? undefined}
            />
          </div>
          <StockBadge stock={product.stock_quantity} lowStockThreshold={product.low_stock_threshold} />
        </div>
        <Link
          href={`/products/${product.slug}`}
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-600"
        >
          View product
        </Link>
      </CardContent>
    </Card>
  );
}
