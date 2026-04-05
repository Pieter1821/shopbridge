import { auth } from "@clerk/nextjs/server";
import { AccountOrdersPanel } from "@/components/account/AccountOrdersPanel";
import { createClient as createAdminClient } from "@/lib/supabase/admin";

type AccountOrder = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  total_cents: number;
  shipping_method: string | null;
  shipping_address: unknown;
  created_at: string;
  order_items: Array<{
    product_name: string;
    quantity: number;
  }> | null;
};

type AccountPageProps = {
  searchParams?: Promise<{ tab?: string }>;
};

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const { userId } = await auth();
  const rawSearchParams = searchParams ? await searchParams : {};
  const currentTab = ["all", "active", "delivered", "cancelled"].includes(rawSearchParams?.tab ?? "all")
    ? (rawSearchParams?.tab ?? "all")
    : "all";

  let orders: AccountOrder[] = [];

  if (userId) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_number, status, payment_status, fulfillment_status, total_cents, shipping_method, shipping_address, created_at, order_items(product_name, quantity)",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load account orders", error.message);
      } else {
        orders = (data as AccountOrder[] | null) ?? [];
      }
    } catch (error) {
      console.error("Unexpected account order lookup error", error);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
          {userId ? "Track your orders in one place" : "Sign in to view your account"}
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Follow payment, packing, shipping, and delivery updates from one clean dashboard.
        </p>
      </div>

      {userId ? (
        <AccountOrdersPanel
          orders={orders}
          currentTab={currentTab as "all" | "active" | "delivered" | "cancelled"}
        />
      ) : (
        <div className="mt-6 rounded-4xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          Sign in to see your live order status, payment updates, and delivery progress.
        </div>
      )}
    </div>
  );
}
