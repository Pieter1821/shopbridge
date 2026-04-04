import Link from "next/link";
import { ArrowUpRight, ShieldCheck, Truck, Wallet } from "lucide-react";

import { ProductGrid } from "@/components/products/ProductGrid";
import { getCategories, getFeaturedProducts } from "@/lib/shop";

export const revalidate = 60;

const valueProps = [
  {
    title: "Quality checked",
    description: "Every product is selected for trusted quality and a polished shopping experience.",
    icon: ShieldCheck,
  },
  {
    title: "Nationwide delivery",
    description: "Fast fulfilment across Johannesburg, Cape Town, Durban, and beyond.",
    icon: Truck,
  },
  {
    title: "Flexible checkout",
    description: "A clean buying experience built for modern South African shoppers.",
    icon: Wallet,
  },
];

export default async function Home() {
  const [categories, featuredProducts] = await Promise.all([
    getCategories(),
    getFeaturedProducts(),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-4xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
            Curated finds, clean essentials
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
            South African shopping with a sharper point of view.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-slate-200 sm:text-lg">
            ShopBridge brings together fashion, footwear, accessories, and everyday finds
            with a fast, modern checkout experience for local shoppers.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950"
            >
              Shop the latest <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/checkout"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white"
            >
              Go to checkout
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {valueProps.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="rounded-2xl bg-emerald-50 p-2 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-slate-950">{item.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {categories.length ? (
        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${encodeURIComponent(category.slug)}`}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-slate-950">{category.name}</p>
              <p className="mt-2 text-sm text-slate-600">
                {category.description ?? "Explore this collection on ShopBridge."}
              </p>
            </Link>
          ))}
        </section>
      ) : null}

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
              Featured now
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              Curated drops
            </h2>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-slate-700 hover:text-slate-950"
          >
            View all →
          </Link>
        </div>

        {featuredProducts.length ? (
          <ProductGrid products={featuredProducts} />
        ) : (
          <div className="rounded-4xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <h3 className="text-xl font-semibold text-slate-950">The first drop is almost live</h3>
            <p className="mt-2 text-sm text-slate-600">
              Fresh products will appear here automatically as soon as they are published in Supabase.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
