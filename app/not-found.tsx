import { Card, CardContent, Chip } from "@heroui/react";
import { Compass, Search } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <Card className="soft-mesh w-full overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/90 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.5)] backdrop-blur">
        <CardContent className="gap-5 p-6 text-center sm:p-10">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white">
            <Compass className="h-6 w-6" />
          </div>
          <div className="space-y-3">
            <Chip className="bg-amber-50 text-amber-700" size="sm" variant="soft">
              404 · Page not found
            </Chip>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              This page has wandered off the storefront.
            </h1>
            <p className="mx-auto max-w-2xl text-sm text-slate-600 sm:text-base">
              Try heading back to the catalogue or search for a live product. Stock, checkout, and account pages are still available.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-emerald-600"
            >
              Back to home
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            >
              <Search className="h-4 w-4" />
              Browse products
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
