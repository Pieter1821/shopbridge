import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const SOUTH_AFRICAN_VAT_RATE = 0.15;

export function formatZAR(valueInCents: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(valueInCents / 100);
}

export function calculateVatCents(
  valueInCents: number,
  rate = SOUTH_AFRICAN_VAT_RATE,
) {
  return Math.round(valueInCents * rate);
}

export function calculateTotalIncludingVatCents(
  valueInCents: number,
  rate = SOUTH_AFRICAN_VAT_RATE,
) {
  return valueInCents + calculateVatCents(valueInCents, rate);
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeRemoteImageUrl(value: string | null | undefined): string | null {
  const trimmed = String(value ?? "").trim();

  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    if (parsed.hostname.includes("google.") && parsed.pathname.startsWith("/imgres")) {
      const nestedUrl =
        parsed.searchParams.get("imgurl") ??
        parsed.searchParams.get("url") ??
        parsed.searchParams.get("mediaurl");

      return nestedUrl ? normalizeRemoteImageUrl(decodeURIComponent(nestedUrl)) : null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function generateOrderNumber(prefix = "SB") {
  const stamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${stamp}`;
}
