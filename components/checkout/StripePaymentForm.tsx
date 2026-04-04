"use client";

import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState, type FormEvent } from "react";

export function StripePaymentForm({ totalLabel }: { totalLabel: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage("Stripe is still loading. Please wait a moment and try again.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const returnUrl =
      typeof window === "undefined"
        ? "http://localhost:3000/checkout/success"
        : `${window.location.origin}/checkout/success`;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
    });

    if (error) {
      setErrorMessage(error.message ?? "Payment could not be confirmed. Please try again.");
      setIsSubmitting(false);
      return;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <PaymentElement options={{ layout: "tabs" }} />
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || !elements || isSubmitting}
        className="inline-flex w-full items-center justify-center rounded-full bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Processing payment..." : `Pay ${totalLabel}`}
      </button>

      <p className="text-xs text-slate-500">
        3D Secure, bank verification, and redirects are handled securely by Stripe when required.
      </p>
    </form>
  );
}
