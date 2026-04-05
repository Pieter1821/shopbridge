"use client";

import { X } from "lucide-react";

import { notifyLocalStorageChange } from "@/hooks/useLocalStorage";

export const HIDDEN_ORDERS_STORAGE_KEY = "shopbridge-hidden-orders";

function getHiddenOrderIds() {
  if (typeof window === "undefined") {
    return [] as string[];
  }

  try {
    const raw = window.localStorage.getItem(HIDDEN_ORDERS_STORAGE_KEY);
    if (!raw) {
      return [] as string[];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
  } catch {
    return [] as string[];
  }
}

export function DismissOrderButton({ orderId }: { orderId: string }) {
  function handleDismiss() {
    const nextHiddenOrderIds = Array.from(new Set([...getHiddenOrderIds(), orderId]));
    window.localStorage.setItem(HIDDEN_ORDERS_STORAGE_KEY, JSON.stringify(nextHiddenOrderIds));
    notifyLocalStorageChange(HIDDEN_ORDERS_STORAGE_KEY);
  }

  return (
    <button
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
