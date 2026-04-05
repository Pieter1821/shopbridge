import { RealtimeSearchExperience } from "@/components/search/RealtimeSearchExperience";
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
      <RealtimeSearchExperience initialQuery={q} initialResults={results} />
    </div>
  );
}
