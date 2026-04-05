"use client";

import { useMemo, useSyncExternalStore } from "react";

const LOCAL_STORAGE_CHANGE_EVENT = "shopbridge:local-storage-change";

function subscribeToLocalStorage(key: string, callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === key) {
      callback();
    }
  };

  const handleCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<string | undefined>;

    if (!customEvent.detail || customEvent.detail === key) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(LOCAL_STORAGE_CHANGE_EVENT, handleCustomEvent as EventListener);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(LOCAL_STORAGE_CHANGE_EVENT, handleCustomEvent as EventListener);
  };
}

export function notifyLocalStorageChange(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent(LOCAL_STORAGE_CHANGE_EVENT, { detail: key }));
}

export function useLocalStorage<T>(key: string, initialValue: T): T {
  const fallbackRawValue = JSON.stringify(initialValue);

  const rawValue = useSyncExternalStore(
    (callback) => subscribeToLocalStorage(key, callback),
    () => {
      if (typeof window === "undefined") {
        return fallbackRawValue;
      }

      return window.localStorage.getItem(key) ?? fallbackRawValue;
    },
    () => fallbackRawValue,
  );

  return useMemo(() => {
    try {
      return rawValue ? (JSON.parse(rawValue) as T) : initialValue;
    } catch {
      return initialValue;
    }
  }, [initialValue, rawValue]);
}
