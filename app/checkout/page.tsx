"use client";

import { SignInButton, useAuth, useUser } from "@clerk/nextjs";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { StripePaymentForm } from "@/components/checkout/StripePaymentForm";
import { useCartStockSync } from "@/hooks/use-cart-stock-sync";
import {
  DELIVERY_OPTIONS,
  getDeliveryOption,
  type DeliveryOptionId,
} from "@/lib/checkout";
import {
  calculateTotalIncludingVatCents,
  calculateVatCents,
  formatZAR,
} from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const provinces = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
] as const;

type CheckoutCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  province: string;
  postalCode: string;
  deliveryMethod: DeliveryOptionId;
};

const initialCustomer: CheckoutCustomer = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  province: provinces[0],
  postalCode: "",
  deliveryMethod: "standard",
};

const CHECKOUT_DETAILS_STORAGE_KEY = "shopbridge-checkout-details";

function useHydrated() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

export default function CheckoutPage() {
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.totalCents());
  const itemCount = useCartStore((state) => state.itemCount());
  const stockNotice = useCartStore((state) => state.stockNotice);
  const hydrated = useHydrated();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  useCartStockSync(hydrated);

  const [customer, setCustomer] = useState<CheckoutCustomer>(initialCustomer);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [hasLoadedSavedDetails, setHasLoadedSavedDetails] = useState(false);

  const deliveryOption = getDeliveryOption(customer.deliveryMethod);
  const shippingCents = deliveryOption.amountCents;
  const vat = calculateVatCents(subtotal);
  const total = calculateTotalIncludingVatCents(subtotal) + shippingCents;

  const isCustomerReady = Boolean(
    customer.firstName &&
      customer.lastName &&
      customer.email &&
      customer.phone &&
      customer.line1 &&
      customer.city &&
      customer.province &&
      customer.postalCode,
  );

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      const saved = window.localStorage.getItem(CHECKOUT_DETAILS_STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved) as Partial<CheckoutCustomer>;
        setCustomer((current) => ({
          ...current,
          ...parsed,
          province:
            typeof parsed.province === "string" && provinces.includes(parsed.province as (typeof provinces)[number])
              ? (parsed.province as (typeof provinces)[number])
              : current.province,
          deliveryMethod:
            parsed.deliveryMethod === "express" ||
            parsed.deliveryMethod === "same-day" ||
            parsed.deliveryMethod === "standard"
              ? parsed.deliveryMethod
              : current.deliveryMethod,
        }));
      }
    } catch (error) {
      console.error("Failed to restore checkout details", error);
    } finally {
      setHasLoadedSavedDetails(true);
    }
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated || !hasLoadedSavedDetails) {
      return;
    }

    window.localStorage.setItem(CHECKOUT_DETAILS_STORAGE_KEY, JSON.stringify(customer));
  }, [customer, hasLoadedSavedDetails, hydrated]);

  useEffect(() => {
    setClientSecret(null);
    setOrderNumber(null);
  }, [items]);

  useEffect(() => {
    if (!hydrated || !hasLoadedSavedDetails || !isSignedIn || !user) {
      return;
    }

    setCustomer((current) => ({
      ...current,
      firstName: current.firstName || user.firstName || "",
      lastName: current.lastName || user.lastName || "",
      email: current.email || user.primaryEmailAddress?.emailAddress || "",
    }));
  }, [hasLoadedSavedDetails, hydrated, isSignedIn, user]);

  const requiresSignIn = hydrated && isLoaded && !isSignedIn;

  function updateCustomerField<K extends keyof CheckoutCustomer>(
    field: K,
    value: CheckoutCustomer[K],
  ) {
    setCustomer((current) => ({
      ...current,
      [field]: value,
    }));
    setClientSecret(null);
    setOrderNumber(null);
    setCheckoutError(null);
  }

  async function handlePreparePayment() {
    if (!hydrated || itemCount === 0) {
      setCheckoutError("Your cart is empty. Add products before continuing to payment.");
      return;
    }

    if (!isLoaded || !isSignedIn) {
      setCheckoutError("Please sign in to continue to checkout.");
      return;
    }

    if (!isCustomerReady) {
      setCheckoutError("Please complete your contact and delivery details first.");
      return;
    }

    setIsPreparingPayment(true);
    setCheckoutError(null);

    try {
      const response = await fetch("/api/stripe/payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          customer,
        }),
      });

      const payload = (await response.json()) as {
        clientSecret?: string;
        orderNumber?: string;
        error?: string;
      };

      if (!response.ok || !payload.clientSecret) {
        throw new Error(payload.error ?? "Unable to initialise the Stripe payment form.");
      }

      setClientSecret(payload.clientSecret);
      setOrderNumber(payload.orderNumber ?? null);
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "Unable to initialise the Stripe payment form.",
      );
    } finally {
      setIsPreparingPayment(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400">
          Checkout
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
          Secure checkout, powered by Stripe
        </h1>
        <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-300">
          Enter your delivery details, review the final amount including VAT, and pay
          securely with card, Apple Pay, Google Pay, and other supported methods.
        </p>
      </div>

      {requiresSignIn ? (
        <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold">Sign in required</p>
            <p className="mt-1 text-amber-800 dark:text-amber-200">
              Please sign in before you can pay for your order or place a purchase.
            </p>
          </div>
          <SignInButton mode="modal">
            <button className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">
              Sign in to continue
            </button>
          </SignInButton>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Contact details</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                value={customer.firstName}
                onChange={(event) => updateCustomerField("firstName", event.target.value)}
                className="rounded-full border border-slate-300 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="First name"
              />
              <input
                value={customer.lastName}
                onChange={(event) => updateCustomerField("lastName", event.target.value)}
                className="rounded-full border border-slate-300 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Last name"
              />
              <input
                type="email"
                value={customer.email}
                onChange={(event) => updateCustomerField("email", event.target.value)}
                className="sm:col-span-2 rounded-full border border-slate-300 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Email address"
              />
              <input
                type="tel"
                value={customer.phone}
                onChange={(event) => updateCustomerField("phone", event.target.value)}
                className="sm:col-span-2 rounded-full border border-slate-300 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Mobile number"
              />
            </div>
          </section>

          <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Delivery address</h2>
            <div className="mt-4 grid gap-3">
              <input
                value={customer.line1}
                onChange={(event) => updateCustomerField("line1", event.target.value)}
                className="rounded-full border border-slate-300 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Street address"
              />
              <input
                value={customer.line2}
                onChange={(event) => updateCustomerField("line2", event.target.value)}
                className="rounded-full border border-slate-300 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="Apartment, suite, etc. (optional)"
              />
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  value={customer.city}
                  onChange={(event) => updateCustomerField("city", event.target.value)}
                  className="rounded-full border border-slate-300 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  placeholder="City"
                />
                <select
                  value={customer.province}
                  onChange={(event) => updateCustomerField("province", event.target.value)}
                  className="rounded-full border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {provinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
                <input
                  value={customer.postalCode}
                  onChange={(event) => updateCustomerField("postalCode", event.target.value)}
                  className="rounded-full border border-slate-300 px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  placeholder="Postal code"
                />
              </div>
            </div>
          </section>

          <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Delivery method</h2>
            <div className="mt-4 space-y-3">
              {DELIVERY_OPTIONS.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="delivery"
                      checked={customer.deliveryMethod === option.id}
                      onChange={() => updateCustomerField("deliveryMethod", option.id)}
                      className="h-4 w-4"
                    />
                    <span>{option.label}</span>
                  </span>
                  <span className="font-semibold text-slate-950 dark:text-white">
                    {option.amountCents === 0 ? "Free" : formatZAR(option.amountCents)}
                  </span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-4xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Order summary</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
            {hydrated ? `${itemCount} item${itemCount === 1 ? "" : "s"} in your cart` : "Loading your cart..."}
          </p>

          {hydrated && items.length > 0 ? (
            <div className="mt-4 space-y-2 border-b border-slate-200 pb-4 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between gap-4">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{formatZAR(item.priceCents * item.quantity)}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{hydrated ? formatZAR(subtotal) : "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>VAT (15%)</span>
              <span>{hydrated ? formatZAR(vat) : "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Delivery</span>
              <span>{hydrated ? (shippingCents === 0 ? "Free" : formatZAR(shippingCents)) : "—"}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 font-semibold text-slate-950 dark:border-slate-700 dark:text-white">
              <span>Total</span>
              <span>{hydrated ? formatZAR(total) : "—"}</span>
            </div>
          </div>

          {orderNumber ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
              Order {orderNumber} is ready for payment confirmation.
            </div>
          ) : null}

          {stockNotice ? (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              {stockNotice}
            </div>
          ) : null}

          {checkoutError ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200">
              {checkoutError}
            </div>
          ) : null}

          {hydrated && itemCount === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
              Your cart is empty. Add a few products before checkout.
              <Link
                href="/products"
                className="mt-3 inline-flex font-semibold text-slate-950 underline underline-offset-4 dark:text-white"
              >
                Browse products
              </Link>
            </div>
          ) : requiresSignIn ? (
            <SignInButton mode="modal">
              <button
                type="button"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                Sign in to continue
              </button>
            </SignInButton>
          ) : (
            <button
              type="button"
              onClick={handlePreparePayment}
              disabled={!hydrated || !isLoaded || !isSignedIn || itemCount === 0 || !isCustomerReady || isPreparingPayment}
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPreparingPayment
                ? "Preparing Stripe payment..."
                : clientSecret
                  ? "Refresh payment details"
                  : "Continue to payment"}
            </button>
          )}

          {clientSecret ? (
            <section className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Payment method</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Stripe now securely displays the payment methods available for this device,
                browser, and test setup.
              </p>

              {stripePromise ? (
                <div className="mt-4">
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: "stripe",
                      },
                    }}
                  >
                    <StripePaymentForm totalLabel={formatZAR(total)} />
                  </Elements>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                  Add your Stripe test publishable key to enable the payment form.
                </div>
              )}
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
