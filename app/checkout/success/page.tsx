import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import {
  formatOrderStatusLabel,
  getOrderStatusTone,
  getOrderTrackingState,
  getTrackingSteps,
} from "@/lib/order-tracking";
import { getStripe } from "@/lib/stripe";
import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { formatZAR } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CheckoutSuccessPageProps = {
  searchParams: Promise<{
    payment_intent?: string;
    redirect_status?: string;
  }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const { payment_intent: paymentIntentId, redirect_status: redirectStatus } =
    await searchParams;

  let paymentStatus = redirectStatus ?? "processing";
  let order:
    | {
        order_number: string;
        total_cents: number;
        customer_email: string;
        payment_status: string;
        status: string;
        fulfillment_status: string;
        shipping_method: string | null;
      }
    | null = null;

  if (paymentIntentId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      paymentStatus = paymentIntent.status;

      const supabase = createAdminClient();
      const orderResult = await supabase
        .from("orders")
        .select("order_number, total_cents, customer_email, payment_status, status, fulfillment_status, shipping_method")
        .eq("payment_reference", paymentIntentId)
        .maybeSingle();

      order = orderResult.data;

      if (paymentIntent.status === "succeeded" && order && order.payment_status !== "paid") {
        await supabase
          .from("orders")
          .update({
            payment_status: "paid",
            status: "confirmed",
            payment_provider: "stripe",
          })
          .eq("payment_reference", paymentIntentId);

        await supabase
          .from("payments")
          .update({ status: "paid", payload: paymentIntent })
          .eq("reference", paymentIntentId);

        order = {
          ...order,
          payment_status: "paid",
          status: "confirmed",
        };
      }
    } catch (error) {
      console.error("Failed to confirm Stripe payment on success page", error);
    }
  }

  const isPaid = paymentStatus === "succeeded";
  const tracking = order ? getOrderTrackingState(order.status, order.payment_status) : null;
  const steps = order ? getTrackingSteps(order.status) : [];

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <div className="flex items-center gap-3 text-emerald-700">
          <CheckCircle2 className="h-8 w-8" />
          <p className="text-sm font-semibold uppercase tracking-[0.25em]">
            {isPaid ? "Payment confirmed" : "Payment update"}
          </p>
        </div>

        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
          {isPaid ? "Thanks — your order is confirmed" : "We’re still checking your payment"}
        </h1>

        <p className="mt-3 text-slate-600">
          {isPaid
            ? "Your Stripe test payment went through successfully and your order is now in the system."
            : "If your bank required 3D Secure or a redirect, this page will reflect the latest status once Stripe finishes processing it."}
        </p>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          {order ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getOrderStatusTone(order.status)}`}>
                  {formatOrderStatusLabel(order.status)}
                </span>
                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getOrderStatusTone(order.payment_status)}`}>
                  Payment {formatOrderStatusLabel(order.payment_status)}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <span>Order number</span>
                  <span className="font-semibold text-slate-950">{order.order_number}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Total paid</span>
                  <span className="font-semibold text-slate-950">{formatZAR(order.total_cents)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Receipt email</span>
                  <span className="font-semibold text-slate-950">{order.customer_email}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span>Delivery</span>
                  <span className="font-semibold text-slate-950">{order.shipping_method ?? "Standard"}</span>
                </div>
              </div>

              {tracking ? (
                <div className="rounded-2xl bg-white p-4">
                  <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                    <span>{tracking.summary}</span>
                    <span className="font-semibold text-slate-950">{Math.round(tracking.progressPercent)}%</span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-200">
                    <div className="h-2 rounded-full bg-slate-950" style={{ width: `${tracking.progressPercent}%` }} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-5">
                    {steps.map((step) => (
                      <div key={step.key} className="flex items-center gap-2 text-slate-600">
                        <span className={`h-2.5 w-2.5 rounded-full ${step.completed ? "bg-slate-950" : "bg-slate-300"}`} />
                        <span className={step.current ? "font-semibold text-slate-950" : ""}>{step.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <p>Stripe has returned you to ShopBridge. Your order details will appear here once payment is finalised.</p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/products"
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
          >
            Continue shopping
          </Link>
          <Link
            href="/account#order-tracking"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"
          >
            Track this order
          </Link>
        </div>
      </div>
    </div>
  );
}
