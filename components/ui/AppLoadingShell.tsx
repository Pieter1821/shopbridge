import { Skeleton, Spinner } from "@heroui/react";

type AppLoadingShellProps = {
  title: string;
  subtitle: string;
  accent?: "store" | "admin";
};

export function AppLoadingShell({ title, subtitle, accent = "store" }: AppLoadingShellProps) {
  const tint = accent === "admin" ? "text-sky-700" : "text-emerald-700";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.45)] backdrop-blur sm:p-8">
        <div className="flex items-center gap-3">
          <Spinner color={accent === "admin" ? "accent" : "success"} size="sm" />
          <div>
            <p className={`text-sm font-semibold uppercase tracking-[0.25em] ${tint}`}>Loading</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{title}</h1>
            <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="mt-4 h-8 w-20 rounded-xl" />
              <Skeleton className="mt-3 h-3 w-28 rounded-full" />
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-4">
              <Skeleton className="h-40 w-full rounded-[1.25rem]" />
              <Skeleton className="mt-4 h-4 w-20 rounded-full" />
              <Skeleton className="mt-3 h-6 w-4/5 rounded-xl" />
              <Skeleton className="mt-3 h-3 w-full rounded-full" />
              <Skeleton className="mt-2 h-3 w-3/4 rounded-full" />
              <div className="mt-4 flex items-center justify-between gap-3">
                <Skeleton className="h-6 w-24 rounded-xl" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="mt-4 h-10 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
