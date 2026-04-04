export const metadata = {
  title: "Privacy Policy",
};

const sections = [
  {
    title: "What we collect",
    body:
      "ShopBridge stores the contact, delivery, and payment-related information needed to process orders and support your account experience.",
  },
  {
    title: "How your data is used",
    body:
      "Your information is used to authenticate your account, fulfil orders, process payments securely, and show delivery updates in your dashboard.",
  },
  {
    title: "How we protect it",
    body:
      "We use trusted providers such as Clerk, Supabase, and Stripe to help secure customer accounts, order records, and payment flows.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400">
          Legal
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          This page explains how ShopBridge handles customer information used for checkout, fulfilment, and account tracking.
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
