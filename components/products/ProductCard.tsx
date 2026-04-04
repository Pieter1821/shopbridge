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
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative h-56 overflow-hidden bg-slate-100">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={product.name}
            fill
            sizes="(min-width: 1280px) 24vw, (min-width: 768px) 33vw, 100vw"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 text-sm font-medium text-slate-500">
            Product image coming soon
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-slate-950/90 via-slate-900/50 to-transparent p-5 text-white">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-200">{brand}</p>
              <h3 className="mt-2 line-clamp-2 text-xl font-semibold">{product.name}</h3>
            </div>
            <span className="rounded-full border border-white/20 bg-slate-900/40 px-2 py-1 text-xs capitalize text-slate-100">
              {categoryLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <p className="line-clamp-3 text-sm text-slate-600">
          {product.description ?? "Premium style, clean lines, and everyday comfort."}
        </p>
        {tags.length ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
              >
                {tag}
              </span>
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
          <StockBadge stock={product.stock_quantity} />
        </div>
        <Link
          href={`/products/${product.slug}`}
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          View product
        </Link>
      </div>
    </article>
  );
}
