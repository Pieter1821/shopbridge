export type TrackingOrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export type TrackingPaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "partially_refunded"
  | "refunded";

type ShippingAddressLike = {
  city: string | null;
  province: string | null;
  postalCode: string | null;
  country: string | null;
};

const progressStages = [
  { key: "pending", label: "Received" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Preparing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
] as const;

function normalizeShippingAddress(input: unknown): ShippingAddressLike {
  if (!input || typeof input !== "object") {
    return {
      city: null,
      province: null,
      postalCode: null,
      country: null,
    };
  }

  const address = input as Record<string, unknown>;

  return {
    city: typeof address.city === "string" ? address.city : null,
    province: typeof address.province === "string" ? address.province : null,
    postalCode:
      typeof address.postal_code === "string"
        ? address.postal_code
        : typeof address.postalCode === "string"
          ? address.postalCode
          : null,
    country: typeof address.country === "string" ? address.country : null,
  };
}

function addBusinessDays(date: Date, days: number) {
  const result = new Date(date);

  while (days > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();

    if (day !== 0 && day !== 6) {
      days -= 1;
    }
  }

  return result;
}

function formatEtaDate(date: Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export function formatOrderStatusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getOrderStatusTone(status: string) {
  switch (status) {
    case "delivered":
    case "paid":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "shipped":
    case "processing":
    case "packed":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "pending":
    case "confirmed":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "cancelled":
    case "failed":
    case "refunded":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

export function getOrderTrackingState(
  status: string,
  paymentStatus?: string | null,
) {
  const normalizedStatus = status as TrackingOrderStatus;
  const normalizedPaymentStatus = paymentStatus as TrackingPaymentStatus | null | undefined;

  if (normalizedStatus === "cancelled") {
    return {
      progressPercent: 100,
      summary: "This order was cancelled.",
      activeIndex: -1,
    };
  }

  if (normalizedStatus === "refunded" || normalizedPaymentStatus === "refunded") {
    return {
      progressPercent: 100,
      summary: "This order was refunded.",
      activeIndex: -1,
    };
  }

  const shippedLikeStatus = normalizedStatus === "packed" ? "processing" : normalizedStatus;
  const activeIndex = progressStages.findIndex((stage) => stage.key === shippedLikeStatus);
  const progressPercent = activeIndex >= 0 ? ((activeIndex + 1) / progressStages.length) * 100 : 8;

  const summary =
    normalizedPaymentStatus === "pending" || normalizedPaymentStatus === "unpaid"
      ? "Payment is being confirmed before dispatch."
      : normalizedStatus === "pending"
        ? "Your order has been placed and is waiting for confirmation."
        : normalizedStatus === "confirmed"
          ? "Your order is confirmed and about to be prepared."
          : normalizedStatus === "processing"
            ? "Your items are being prepared for dispatch."
            : normalizedStatus === "packed"
              ? "Your parcel is packed and nearly ready to leave."
              : normalizedStatus === "shipped"
                ? "Your order is on the way."
                : normalizedStatus === "delivered"
                  ? "Delivered successfully."
                  : "Tracking updates will appear here as the order moves.";

  return {
    progressPercent,
    summary,
    activeIndex,
  };
}

export function getTrackingSteps(status: string) {
  const normalizedStatus = status === "packed" ? "processing" : status;
  const activeIndex = progressStages.findIndex((stage) => stage.key === normalizedStatus);

  return progressStages.map((stage, index) => ({
    ...stage,
    completed: activeIndex >= index,
    current: activeIndex === index,
  }));
}

export function getOrderDeliveryMeta({
  orderNumber,
  status,
  shippingMethod,
  shippingAddress,
  createdAt,
}: {
  orderNumber: string;
  status: string;
  shippingMethod?: string | null;
  shippingAddress?: unknown;
  createdAt: string;
}) {
  const address = normalizeShippingAddress(shippingAddress);
  const province = (address.province ?? "").toLowerCase();
  const city = (address.city ?? "").toLowerCase();
  const normalizedMethod = (shippingMethod ?? "standard").toLowerCase();
  const isCapeTownSameDay = normalizedMethod.includes("same-day") && city.includes("cape town");
  const isExpress = normalizedMethod.includes("express");
  const isMetroProvince = ["gauteng", "western cape", "kwazulu-natal"].includes(province);

  const courier = isCapeTownSameDay
    ? "ShopBridge Same-Day Courier"
    : isExpress
      ? "The Courier Guy Express"
      : isMetroProvince
        ? "The Courier Guy Standard"
        : "Pargo Regional";

  const [minDays, maxDays] = isCapeTownSameDay
    ? [0, 0]
    : isExpress
      ? isMetroProvince
        ? [1, 2]
        : [2, 3]
      : isMetroProvince
        ? [2, 4]
        : [3, 5];

  const created = new Date(createdAt);
  const etaStart = addBusinessDays(created, minDays);
  const etaEnd = addBusinessDays(created, maxDays);
  const etaWindow =
    status === "delivered"
      ? "Delivered"
      : status === "cancelled" || status === "refunded"
        ? "No ETA available"
        : minDays === maxDays
          ? formatEtaDate(etaEnd)
          : `${formatEtaDate(etaStart)} – ${formatEtaDate(etaEnd)}`;

  const cleanOrderNumber = orderNumber.replace(/[^A-Z0-9]/gi, "").toUpperCase();
  const trackingReference = ["shipped", "delivered"].includes(status)
    ? `TRK-${cleanOrderNumber.slice(-8)}`
    : "Available once shipped";

  return {
    courier,
    trackingReference,
    etaWindow,
    destination: [address.city, address.province].filter(Boolean).join(", ") || "South Africa",
  };
}
