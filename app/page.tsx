import Link from "next/link";
import { Card, CardContent, Chip } from "@heroui/react";
import { ArrowUpRight, ShieldCheck, Sparkles, Truck, Wallet, Zap } from "lucide-react";

import { ProductGrid } from "@/components/products/ProductGrid";
import { getCategories, getFeaturedProducts } from "@/lib/shop";

export const revalidate = 60;

const heroHighlights = ["Realtime stock", "Secure checkout", "Local delivery"];

const heroStats = [
  { label: "Fast lanes", value: "3-step" },
  { label: "Local currency", value: "ZAR" },
  { label: "Stock sync", value: "Live" },
];

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
  const [categories, featuredProducts] = await Promise.all([getCategories(), getFeaturedProducts()]);
  const featuredCategories = categories.slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="soft-mesh relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.7)] sm:p-8">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-wrap gap-2">
              {heroHighlights.map((item) => (
                <Chip key={item} className="border border-white/10 bg-white/10 text-white backdrop-blur" size="sm" variant="soft">
                  {item}
                </Chip>
              ))}
            </div>

            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
              Curated finds, clean essentials
            </p>
            <h1 className="mt-3 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
              South African shopping with a sharper point of view.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-200 sm:text-lg">
              ShopBridge brings together fashion, footwear, accessories, and everyday finds with a faster,
              calmer checkout flow for local shoppers.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="hover-lift inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-slate-950/20"
              >
                Shop the latest <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/checkout"
                className="hover-lift inline-flex items-center rounded-full border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur"
              >
                Go to checkout
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {heroStats.map((item) => (
                <Card key={item.label} className="border border-white/10 bg-white/5 text-white shadow-none backdrop-blur">
                  <CardContent className="gap-1 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{item.label}</p>
                    <p className="text-2xl font-black tracking-tight">{item.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {valueProps.map((item, index) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.title}
                className="hover-lift border border-slate-200/80 bg-white/90 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/90"
              >
                <CardContent className="flex flex-row items-start gap-3 p-5">
                  <span className="rounded-2xl bg-emerald-50 p-2 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-slate-950 dark:text-white">{item.title}</h2>
                      {index === 0 ? (
                        <Chip color="success" size="sm" variant="soft">
                          Recommended
                        </Chip>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {featuredCategories.length ? (
        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                Categories
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                Fewer, clearer ways to browse
              </h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {featuredCategories.length} of {categories.length} live categories
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featuredCategories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${encodeURIComponent(category.slug)}`}
              className="hover-lift rounded-3xl border border-slate-200/80 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/90"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-950 dark:text-white">{category.name}</p>
                <Sparkles className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {category.description ?? "Explore this collection on ShopBridge."}
              </p>
            </Link>
          ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <Chip className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200" size="sm" variant="soft">
              Featured now
            </Chip>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl dark:text-white">Curated drops</h2>
          </div>
          <Link href="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950 dark:text-slate-200 dark:hover:text-white">
            View all <Zap className="h-4 w-4" />
          </Link>
        </div>

        {featuredProducts.length ? (
          <ProductGrid products={featuredProducts} />
        ) : (
          <div className="rounded-4xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">The first drop is almost live</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Fresh products will appear here automatically as soon as they are published in Supabase.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
