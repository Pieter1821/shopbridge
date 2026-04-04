import { calculateTotalIncludingVatCents } from "@/lib/utils";

export const DELIVERY_OPTIONS = [
  {
    id: "standard",
    label: "Standard delivery · 2–4 business days",
    amountCents: 0,
  },
  {
    id: "express",
    label: "Express delivery · 1–2 business days",
    amountCents: 9900,
  },
  {
    id: "same-day",
    label: "Cape Town same-day courier on selected drops",
    amountCents: 14900,
  },
] as const;

export type DeliveryOptionId = (typeof DELIVERY_OPTIONS)[number]["id"];

export function getDeliveryOption(optionId?: string | null) {
  return DELIVERY_OPTIONS.find((option) => option.id === optionId) ?? DELIVERY_OPTIONS[0];
}

export function calculateCheckoutTotalCents(
  subtotalCents: number,
  shippingCents = 0,
) {
  return calculateTotalIncludingVatCents(subtotalCents) + shippingCents;
}
