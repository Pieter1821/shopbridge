import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import { cancelOrderAction } from "./actions";

import {
  canCancelOrder,
  formatOrderStatusLabel,
  getOrderDeliveryMeta,
  getOrderStatusTone,
  getOrderTrackingState,
  getTrackingSteps,
} from "@/lib/order-tracking";
import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { formatZAR } from "@/lib/utils";

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

function buildAccountHref(tab: string) {
  return tab === "all" ? "/account#order-tracking" : `/account?tab=${tab}#order-tracking`;
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

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

  const openOrders = orders.filter((order) => !["delivered", "cancelled", "refunded"].includes(order.status)).length;
  const deliveredOrders = orders.filter((order) => order.status === "delivered").length;
  const cancelledOrders = orders.filter((order) => ["cancelled", "refunded"].includes(order.status)).length;
  const visibleOrders = orders.filter((order) => {
    if (currentTab === "active") {
      return !["delivered", "cancelled", "refunded"].includes(order.status);
    }

    if (currentTab === "delivered") {
      return order.status === "delivered";
    }

    if (currentTab === "cancelled") {
      return ["cancelled", "refunded"].includes(order.status);
    }

    return true;
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          {userId ? "Track your orders in one place" : "Sign in to view your account"}
        </h1>
        <p className="mt-3 text-slate-600">
          Follow payment, packing, shipping, and delivery updates from one clean dashboard.
        </p>
      </div>

      {userId ? (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Open orders</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{openOrders}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Delivered</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{deliveredOrders}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Cancelled / refunded</p>
              <p className="mt-2 text-3xl font-black text-slate-950">{cancelledOrders}</p>
            </div>
          </div>

          <section id="order-tracking" className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
                  Order tracking
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Order history & live tracking
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Review each order at a glance, cancel eligible orders before shipment, and keep an eye on ETA and courier details.
                </p>
              </div>
              <Link
                href="/products"
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Keep shopping
              </Link>
            </div>

            {orders.length > 0 ? (
              <div className="mt-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "all", label: `All (${orders.length})` },
                    { key: "active", label: `Active (${openOrders})` },
                    { key: "delivered", label: `Delivered (${deliveredOrders})` },
                    { key: "cancelled", label: `Cancelled (${cancelledOrders})` },
                  ].map((tab) => {
                    const active = currentTab === tab.key;

                    return (
                      <Link
                        key={tab.key}
                        href={buildAccountHref(tab.key)}
                        className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                          active
                            ? "bg-slate-950 text-white"
                            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {tab.label}
                      </Link>
                    );
                  })}
                </div>

                {visibleOrders.map((order) => {
                  const tracking = getOrderTrackingState(order.status, order.payment_status);
                  const steps = getTrackingSteps(order.status);
                  const deliveryMeta = getOrderDeliveryMeta({
                    orderNumber: order.order_number,
                    status: order.status,
                    shippingMethod: order.shipping_method,
                    shippingAddress: order.shipping_address,
                    createdAt: order.created_at,
                  });
                  const isArchived = ["delivered", "cancelled", "refunded"].includes(order.status);
                  const isCancellable = canCancelOrder(order.status, order.payment_status);

                  return (
                    <article key={order.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                              {order.order_number}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Placed {formatOrderDate(order.created_at)}
                              {order.shipping_method ? ` • ${order.shipping_method}` : ""}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getOrderStatusTone(order.status)}`}>
                              {formatOrderStatusLabel(order.status)}
                            </span>
                            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getOrderStatusTone(order.payment_status)}`}>
                              Payment {formatOrderStatusLabel(order.payment_status)}
                            </span>
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {isArchived ? "History" : "Active"}
                            </span>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                              Order items
                            </p>
                            <div className="mt-3 space-y-2">
                              {order.order_items?.map((item) => (
                                <div key={`${order.id}-${item.product_name}`} className="flex items-center justify-between gap-3 text-sm text-slate-700">
                                  <span>{item.product_name}</span>
                                  <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-700">× {item.quantity}</span>
                                </div>
                              )) ?? <p className="text-sm text-slate-600">Order items</p>}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-white p-4">
                            <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                              <span>{tracking.summary}</span>
                              <span className="font-semibold text-slate-950">{Math.round(tracking.progressPercent)}%</span>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-slate-200">
                              <div
                                className="h-2 rounded-full bg-slate-950 transition-all"
                                style={{ width: `${tracking.progressPercent}%` }}
                              />
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
                              {steps.map((step) => (
                                <div key={step.key} className="flex items-center gap-2 text-slate-600">
                                  <span
                                    className={`h-2.5 w-2.5 rounded-full ${step.completed ? "bg-slate-950" : "bg-slate-300"}`}
                                  />
                                  <span className={step.current ? "font-semibold text-slate-950" : ""}>{step.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Order summary</p>
                          <p className="mt-2 text-2xl font-black text-slate-950">{formatZAR(order.total_cents)}</p>

                          <div className="mt-4 space-y-3 text-sm text-slate-700">
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Courier</p>
                              <p className="mt-1 font-semibold text-slate-950">{deliveryMeta.courier}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tracking ref</p>
                              <p className="mt-1 font-semibold text-slate-950">{deliveryMeta.trackingReference}</p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Estimated delivery</p>
                              <p className="mt-1 font-semibold text-slate-950">{deliveryMeta.etaWindow}</p>
                              <p className="text-xs text-slate-500">{deliveryMeta.destination}</p>
                            </div>
                          </div>

                          {isCancellable ? (
                            <form action={cancelOrderAction} className="mt-5 space-y-2 border-t border-slate-200 pt-4">
                              <input type="hidden" name="order_id" value={order.id} />
                              <button
                                type="submit"
                                className="inline-flex w-full items-center justify-center rounded-full border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
                              >
                                Cancel order
                              </button>
                              <p className="text-xs text-slate-500">
                                Available until the order moves to shipped.
                              </p>
                            </form>
                          ) : null}
                        </aside>
                      </div>
                    </article>
                  );
                })}

                {visibleOrders.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                    No orders match this section yet.
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                No orders yet. Once you checkout, your full order history and delivery progress will appear here automatically.
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="mt-6 rounded-4xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600 shadow-sm">
          Sign in to see your live order status, payment updates, and delivery progress.
        </div>
      )}
    </div>
  );
}
