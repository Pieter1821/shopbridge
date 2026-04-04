import { ProductGrid } from "@/components/products/ProductGrid";
import { searchStoreProducts } from "@/lib/shop";

export const dynamic = "force-dynamic";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const results = await searchStoreProducts(q);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400">
          Search
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          Search results{q ? ` for “${q}”` : ""}
        </h1>
        <form action="/search" className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search products, brands, or tags"
            className="flex-1 rounded-full border border-slate-300 px-4 py-3 text-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          >
            Search
          </button>
        </form>
      </section>

      <div className="mt-6">
        {results.length > 0 ? (
          <ProductGrid products={results} />
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">
            No live products matched that search.
          </div>
        )}
      </div>
    </div>
  );
}
