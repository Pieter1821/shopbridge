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

const progressStages = [
  { key: "pending", label: "Received" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Preparing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
] as const;

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
