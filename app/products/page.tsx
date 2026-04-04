import Link from "next/link";

import { ProductGrid } from "@/components/products/ProductGrid";
import { getAllProducts, getCategories } from "@/lib/shop";

export const revalidate = 60;

type ProductsPageProps = {
  searchParams?: Promise<{ category?: string }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = searchParams ? await searchParams : {};
  const selectedCategory = params.category?.trim() ?? "";
  const [categories, products] = await Promise.all([getCategories(), getAllProducts()]);
  const filteredProducts = selectedCategory
    ? products.filter((product) => product.category?.slug === selectedCategory)
    : products;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
          Catalogue
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Shop the latest releases
        </h1>
        <p className="mt-3 max-w-2xl text-slate-600">
          Browse the live ShopBridge product feed and discover the newest arrivals across fashion, accessories, footwear, and everyday essentials.
        </p>

        {categories.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/products"
              className={`rounded-full border px-3 py-1 text-sm transition ${
                !selectedCategory
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              All
            </Link>
            {categories.map((category) => {
              const isActive = category.slug === selectedCategory;
              return (
                <Link
                  key={category.id}
                  href={`/products?category=${encodeURIComponent(category.slug)}`}
                  className={`rounded-full border px-3 py-1 text-sm transition ${
                    isActive
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {category.name}
                </Link>
              );
            })}
          </div>
        ) : null}
      </section>

      <section className="mt-8">
        {filteredProducts.length ? (
          <ProductGrid products={filteredProducts} />
        ) : (
          <div className="rounded-4xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h2 className="text-xl font-semibold text-slate-950">No live products in this category yet</h2>
            <p className="mt-2 text-sm text-slate-600">
              Try another category or return to the full catalogue.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
