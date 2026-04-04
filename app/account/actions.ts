"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

const cancellableStatuses = new Set(["pending", "confirmed", "processing", "packed"]);

function mapRefundStatus(status?: string | null) {
  switch (status) {
    case "succeeded":
      return "refunded" as const;
    case "failed":
    case "canceled":
      return "failed" as const;
    default:
      return "pending" as const;
  }
}

export async function cancelOrderAction(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Please sign in to cancel an order.");
  }

  const orderId = String(formData.get("order_id") ?? "").trim();

  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  const supabase = createAdminClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, order_number, user_id, status, payment_status, payment_reference")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order || order.user_id !== userId) {
    throw new Error("Order not found.");
  }

  if (!cancellableStatuses.has(order.status)) {
    throw new Error("This order can no longer be cancelled.");
  }

  let nextPaymentStatus = order.payment_status;
  let paymentPayload: Record<string, unknown> = {
    cancelled_at: new Date().toISOString(),
    cancelled_by: userId,
  };

  if (order.payment_reference && process.env.STRIPE_SECRET_KEY) {
    const stripe = getStripe();

    if (order.payment_status === "paid") {
      const refund = await stripe.refunds.create({
        payment_intent: order.payment_reference,
        reason: "requested_by_customer",
        metadata: {
          order_id: order.id,
          order_number: order.order_number,
        },
      });

      nextPaymentStatus = mapRefundStatus(refund.status);
      paymentPayload = refund as unknown as Record<string, unknown>;
    } else if (order.payment_status === "pending" || order.payment_status === "unpaid") {
      await stripe.paymentIntents.cancel(order.payment_reference).catch(() => undefined);
      nextPaymentStatus = "failed";
    }
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      payment_status: nextPaymentStatus,
      fulfillment_status: "unfulfilled",
    })
    .eq("id", order.id)
    .eq("user_id", userId);

  if (updateError) {
    throw new Error(`Unable to cancel order: ${updateError.message}`);
  }

  if (order.payment_reference) {
    await supabase
      .from("payments")
      .update({
        status: nextPaymentStatus,
        payload: paymentPayload,
      })
      .eq("reference", order.payment_reference);
  }

  await supabase.from("order_status_history").insert({
    order_id: order.id,
    status: "cancelled",
    note: nextPaymentStatus === "refunded" ? "Cancelled by customer and refunded." : "Cancelled by customer.",
    changed_by: userId,
  });

  revalidatePath("/account");
  revalidatePath("/checkout/success");
}
