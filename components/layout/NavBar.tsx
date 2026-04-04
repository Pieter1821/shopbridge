import Link from "next/link";
import { Search } from "lucide-react";

import { AuthControls } from "./AuthControls";
import { CartIndicator } from "./CartIndicator";

const links = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/search?q=jordan", label: "Search" },
  { href: "/checkout", label: "Checkout" },
];

export function NavBar() {
  const hasClerkKeys = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-lg font-black tracking-tight text-slate-950">
              ShopBridge
            </span>
            <span className="text-xs text-slate-500">South African online shopping</span>
          </Link>

          <nav className="hidden items-center gap-4 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <form
            action="/search"
            className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 md:flex"
          >
            <Search className="h-4 w-4 text-slate-400" />
            <input
              name="q"
              type="search"
              placeholder="Search products"
              className="w-40 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </form>

          {hasClerkKeys ? <AuthControls /> : null}

          <CartIndicator />
        </div>
      </div>
    </header>
  );
}
