export const metadata = {
  title: "Terms & Conditions",
};

const sections = [
  {
    title: "Using ShopBridge",
    body:
      "By browsing or purchasing through ShopBridge, you agree to use the site lawfully and provide accurate checkout and account details.",
  },
  {
    title: "Orders and payments",
    body:
      "All orders are subject to stock availability, payment confirmation, and review for fraud prevention and fulfilment checks.",
  },
  {
    title: "Returns and support",
    body:
      "If you need help with a delivery, refund, or cancellation, contact support through your account or the store contact channels shown on the site.",
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400">
          Legal
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
          Terms & Conditions
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          These terms outline how ShopBridge orders, payments, and customer accounts are handled.
        </p>

        <div className="mt-6 space-y-4">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{section.title}</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
