"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

const HIDDEN_ORDERS_STORAGE_KEY = "shopbridge-hidden-orders";

function getHiddenOrderIds() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const raw = localStorage.getItem(HIDDEN_ORDERS_STORAGE_KEY);
    if (!raw) {
      return new Set<string>();
    }

    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.map((value) => String(value)) : []);
  } catch {
    return new Set<string>();
  }
}

export function DismissOrderButton({ orderId }: { orderId: string }) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (getHiddenOrderIds().has(orderId)) {
      buttonRef.current?.closest("[data-order-id]")?.remove();
    }
  }, [orderId]);

  function handleDismiss() {
    const hiddenOrderIds = getHiddenOrderIds();
    hiddenOrderIds.add(orderId);
    localStorage.setItem(HIDDEN_ORDERS_STORAGE_KEY, JSON.stringify(Array.from(hiddenOrderIds)));
    buttonRef.current?.closest("[data-order-id]")?.remove();
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleDismiss}
      aria-label="Remove this order from view"
      title="Remove this order from view"
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
    >
      <X className="h-4 w-4" />
    </button>
  );
}
