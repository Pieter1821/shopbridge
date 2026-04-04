const footerLinks = [
  "Authenticity first",
  "Nationwide delivery",
  "Secure checkout",
  "Curated weekly drops",
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-10 text-sm text-slate-600 sm:px-6 lg:px-8">
        <div>
          <h2 className="text-base font-semibold text-slate-950">ShopBridge</h2>
          <p className="mt-1 max-w-2xl">
            Fashion, accessories, footwear, and everyday essentials for modern South African shoppers.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {footerLinks.map((item) => (
            <span
              key={item}
              className="rounded-full border border-slate-200 bg-white px-3 py-1"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
