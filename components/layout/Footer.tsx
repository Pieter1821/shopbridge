import Link from "next/link";

const footerLinks = [
  "Authenticity first",
  "Nationwide delivery",
  "Secure checkout",
  "Curated weekly drops",
];

const legalLinks = [
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 text-sm text-slate-600 dark:text-slate-300 sm:px-6 lg:px-8">
        <div>
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">ShopBridge</h2>
          <p className="mt-1 max-w-2xl">
            Fashion, accessories, footwear, and everyday essentials for modern South African shoppers.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {footerLinks.map((item) => (
            <span
              key={item}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          {legalLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-medium text-slate-700 underline-offset-4 transition hover:text-slate-950 hover:underline dark:text-slate-200 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          © {year} ShopBridge. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
