"use client";

import { Button, Card, CardContent, Chip } from "@heroui/react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center px-4 py-10 sm:px-6 lg:px-8">
      <Card className="w-full overflow-hidden rounded-[2rem] border border-rose-100 bg-white/95 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.5)] backdrop-blur">
        <CardContent className="gap-5 p-6 sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <div className="space-y-3">
            <Chip className="bg-rose-50 text-rose-700" size="sm" variant="soft">
              Something went wrong
            </Chip>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              We hit a temporary storefront issue.
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
              Please try the action again. If the problem keeps happening, head back to the catalogue and retry from there.
            </p>
            {error?.message ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {error.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button className="rounded-full bg-emerald-600 text-white" onPress={reset}>
              <RefreshCcw className="h-4 w-4" />
              Try again
            </Button>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
            >
              Go home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
