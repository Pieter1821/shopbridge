import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";

import { calculateCheckoutTotalCents, getDeliveryOption } from "@/lib/checkout";
import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { calculateVatCents } from "@/lib/utils";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().min(1).max(20),
    }),
  ).min(1),
  customer: z.object({
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    email: z.string().trim().email(),
    phone: z.string().trim().min(7),
    line1: z.string().trim().min(3),
    line2: z.string().trim().optional().default(""),
    city: z.string().trim().min(2),
    province: z.string().trim().min(2),
    postalCode: z.string().trim().min(3),
    deliveryMethod: z.string().trim().min(1),
  }),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = checkoutSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please complete your cart and shipping details before payment." },
        { status: 400 },
      );
    }

    const { items, customer } = parsed.data;
    const { userId } = await auth();
    const supabase = createAdminClient();

    const productIds = [...new Set(items.map((item) => item.productId))];
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, slug, brand, sku, price_cents, stock_quantity, is_active")
      .in("id", productIds)
      .eq("is_active", true);

    if (productsError) {
      console.error("Failed to load products for payment", productsError.message);
      return NextResponse.json({ error: "Unable to prepare this payment right now." }, { status: 500 });
    }

    const productMap = new Map((products ?? []).map((product) => [product.id, product]));
    const resolvedItems = items.map((item) => {
      const product = productMap.get(item.productId);
      return { item, product };
    });

    if (resolvedItems.some(({ product }) => !product)) {
      return NextResponse.json(
        { error: "One or more items in your cart are no longer available." },
        { status: 400 },
      );
    }

    if (resolvedItems.some(({ item, product }) => (product?.stock_quantity ?? 0) < item.quantity)) {
      return NextResponse.json(
        { error: "Some cart quantities exceed current stock levels." },
        { status: 400 },
      );
    }

    const shippingOption = getDeliveryOption(customer.deliveryMethod);
    const subtotalCents = resolvedItems.reduce(
      (sum, { item, product }) => sum + (product?.price_cents ?? 0) * item.quantity,
      0,
    );
    const vatCents = calculateVatCents(subtotalCents);
    const shippingCents = shippingOption.amountCents;
    const totalCents = calculateCheckoutTotalCents(subtotalCents, shippingCents);

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: "zar",
      automatic_payment_methods: {
        enabled: true,
      },
      receipt_email: customer.email,
      description: `ShopBridge payment for ${customer.firstName} ${customer.lastName}`,
      shipping: {
        name: `${customer.firstName} ${customer.lastName}`,
        phone: customer.phone,
        address: {
          line1: customer.line1,
          line2: customer.line2 || undefined,
          city: customer.city,
          state: customer.province,
          postal_code: customer.postalCode,
          country: "ZA",
        },
      },
      metadata: {
        customer_email: customer.email,
        delivery_method: shippingOption.id,
        item_count: String(items.length),
      },
    });

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId ?? null,
        status: "pending",
        payment_status: "pending",
        fulfillment_status: "unfulfilled",
        subtotal_cents: subtotalCents,
        shipping_cents: shippingCents,
        tax_cents: vatCents,
        total_cents: totalCents,
        currency: "ZAR",
        customer_email: customer.email,
        customer_phone: customer.phone,
        shipping_method: shippingOption.label,
        payment_provider: "stripe",
        payment_reference: paymentIntent.id,
        shipping_address: {
          first_name: customer.firstName,
          last_name: customer.lastName,
          phone: customer.phone,
          line1: customer.line1,
          line2: customer.line2 || null,
          city: customer.city,
          province: customer.province,
          postal_code: customer.postalCode,
          country: "ZA",
        },
      })
      .select("id, order_number")
      .single();

    if (orderError || !order) {
      console.error("Failed to create order before payment", orderError?.message);
      await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => undefined);
      return NextResponse.json({ error: "Unable to create your order right now." }, { status: 500 });
    }

    const orderItems = resolvedItems.map(({ item, product }) => ({
      order_id: order.id,
      product_id: product!.id,
      sku: product!.sku,
      product_name: product!.name,
      quantity: item.quantity,
      unit_price_cents: product!.price_cents,
      total_cents: product!.price_cents * item.quantity,
      metadata: {
        slug: product!.slug,
        brand: product!.brand,
      },
    }));

    const { error: orderItemsError } = await supabase.from("order_items").insert(orderItems);

    if (orderItemsError) {
      console.error("Failed to create order items", orderItemsError.message);
      await supabase.from("orders").delete().eq("id", order.id);
      await stripe.paymentIntents.cancel(paymentIntent.id).catch(() => undefined);
      return NextResponse.json({ error: "Unable to prepare your order items." }, { status: 500 });
    }

    await stripe.paymentIntents.update(paymentIntent.id, {
      metadata: {
        ...paymentIntent.metadata,
        order_id: order.id,
        order_number: order.order_number,
      },
    });

    await supabase.from("payments").insert({
      order_id: order.id,
      provider: "stripe",
      reference: paymentIntent.id,
      amount_cents: totalCents,
      status: "pending",
      payload: {
        payment_intent_id: paymentIntent.id,
        client_secret_present: Boolean(paymentIntent.client_secret),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderNumber: order.order_number,
      subtotalCents,
      vatCents,
      shippingCents,
      totalCents,
    });
  } catch (error) {
    console.error("Stripe payment intent creation failed", error);
    return NextResponse.json(
      { error: "Stripe could not initialise the payment. Check your test keys and try again." },
      { status: 500 },
    );
  }
}
