"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { AuthControls } from "./AuthControls";
import { CartIndicator } from "./CartIndicator";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/search?q=jordan", label: "Search" },
  { href: "/checkout", label: "Checkout" },
];

export function NavBar() {
  const pathname = usePathname();
  const hasClerkKeys = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const [mobileOpen, setMobileOpen] = useState(false);

  function handlePointerMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--spotlight-x", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--spotlight-y", `${event.clientY - rect.top}px`);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/90">
      <div onMouseMove={handlePointerMove} className="spotlight-surface relative w-full">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-4 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/" onClick={() => setMobileOpen(false)} className="flex flex-col leading-none">
              <span className="text-lg font-black tracking-tight text-slate-950 dark:text-white">ShopBridge</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">South African online shopping</span>
            </Link>
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href.split("?")[0]));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-slate-950 text-white dark:bg-emerald-600"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <form
              action="/search"
              className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50/90 px-3 py-2 xl:flex dark:border-slate-700 dark:bg-slate-900/90"
            >
              <Search className="h-4 w-4 text-slate-400" />
              <input
                name="q"
                type="search"
                placeholder="Search products"
                className="w-44 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </form>

            <ThemeToggle />
            {hasClerkKeys ? <AuthControls /> : null}
            <CartIndicator />

            <button
              type="button"
              onClick={() => setMobileOpen((current) => !current)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:text-slate-950 lg:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className={cn("overflow-hidden transition-all duration-300 lg:hidden", mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0")}>
          <div className="border-t border-slate-200/80 px-3 py-3 dark:border-slate-800">
            <form
              action="/search"
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            >
              <Search className="h-4 w-4 text-slate-400" />
              <input
                name="q"
                type="search"
                placeholder="Search products"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </form>

            <nav className="mt-3 grid gap-2">
              {links.map((link) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href.split("?")[0]));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "rounded-2xl px-3 py-2 text-sm font-medium transition",
                      isActive
                        ? "bg-slate-950 text-white dark:bg-emerald-600"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
