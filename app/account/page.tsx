import { auth } from "@clerk/nextjs/server";

export default async function AccountPage() {
  const { userId } = await auth();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          {userId ? "Welcome back to ShopBridge" : "Sign in to view your account"}
        </h1>
        <p className="mt-3 text-slate-600">
          Track your orders, manage your addresses, and keep an eye on your wishlist from one clean dashboard.
        </p>
      </div>
    </div>
  );
}
