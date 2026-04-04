import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

async function upsertPaymentStatus(reference: string, status: "paid" | "failed", amountCents: number, payload: unknown) {
  const supabase = createAdminClient();
  const existing = await supabase
    .from("payments")
    .select("id")
    .eq("reference", reference)
    .maybeSingle();

  if (existing.data?.id) {
    await supabase
      .from("payments")
      .update({ status, payload })
      .eq("id", existing.data.id);
    return;
  }

  const order = await supabase
    .from("orders")
    .select("id")
    .eq("payment_reference", reference)
    .maybeSingle();

  if (order.data?.id) {
    await supabase.from("payments").insert({
      order_id: order.data.id,
      provider: "stripe",
      reference,
      amount_cents: amountCents,
      status,
      payload,
    });
  }
}

async function markOrderPaid(reference: string, amountCents: number, payload: unknown) {
  const supabase = createAdminClient();

  await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      status: "confirmed",
      payment_provider: "stripe",
      payment_reference: reference,
    })
    .eq("payment_reference", reference);

  await upsertPaymentStatus(reference, "paid", amountCents, payload);
}

async function markOrderFailed(reference: string, amountCents: number, payload: unknown) {
  const supabase = createAdminClient();

  await supabase
    .from("orders")
    .update({
      payment_status: "failed",
      payment_provider: "stripe",
      payment_reference: reference,
    })
    .eq("payment_reference", reference);

  await upsertPaymentStatus(reference, "failed", amountCents, payload);
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return new Response("Missing STRIPE_WEBHOOK_SECRET", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing Stripe signature", { status: 400 });
  }

  const payload = await req.text();
  const stripe = getStripe();

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        await markOrderPaid(paymentIntent.id, paymentIntent.amount_received || paymentIntent.amount, paymentIntent);
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        await markOrderFailed(paymentIntent.id, paymentIntent.amount, paymentIntent);
        break;
      }
      default:
        break;
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Stripe webhook verification failed", error);
    return new Response("Invalid webhook", { status: 400 });
  }
}
