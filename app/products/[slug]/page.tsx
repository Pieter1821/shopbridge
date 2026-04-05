/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PriceDisplay } from "@/components/shared/PriceDisplay";
import { ProductAvailabilityBadge } from "@/components/shared/ProductAvailabilityBadge";
import { getProductBySlug } from "@/lib/shop";
import { normalizeRemoteImageUrl } from "@/lib/utils";

import { AddToCartButton } from "./AddToCartButton";

export const revalidate = 60;

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  return {
    title: product ? `${product.name} | ShopBridge` : "Product | ShopBridge",
    description:
      product?.description ?? "Explore the latest product details on ShopBridge.",
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const brand = product.brand ?? "ShopBridge";
  const categoryLabel = product.category?.name ?? "Products";
  const tags = product.tags?.slice(0, 4) ?? [];
  const heroImage = normalizeRemoteImageUrl(product.images?.[0]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/products"
        className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
      >
        ← Back to products
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="overflow-hidden rounded-4xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="relative aspect-4/5 bg-slate-100">
            {heroImage ? (
              <img
                src={heroImage}
                alt={product.name}
                loading="eager"
                referrerPolicy="no-referrer"
                className="h-full w-full object-contain p-6 sm:object-cover sm:p-0"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 text-sm font-medium text-slate-500">
                Product image coming soon
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-slate-950 px-6 py-5 text-white sm:px-8">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-300">{brand}</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight">{product.name}</h1>
            <p className="mt-4 max-w-2xl text-base text-slate-200">
              {product.description ?? "A refined addition to the ShopBridge catalogue."}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm">
                {categoryLabel}
              </span>
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-300">Live product details</p>
              <PriceDisplay
                className="mt-2"
                priceCents={product.price_cents}
                compareAtPriceCents={product.compare_at_price_cents ?? undefined}
              />
            </div>
            <ProductAvailabilityBadge
              productId={product.id}
              stock={product.stock_quantity}
              lowStockThreshold={product.low_stock_threshold}
            />
          </div>

          <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <li>• Prices are displayed in ZAR.</li>
            <li>• Secure Stripe payment options appear at checkout.</li>
            <li>• Product content is loaded directly from your live catalogue.</li>
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            <AddToCartButton product={product} />
            <Link
              href="/cart"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
            >
              View cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
