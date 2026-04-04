"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

const emptySubscribe = () => () => undefined;

type AuthControlsProps = {
  mobile?: boolean;
};

export function AuthControls({ mobile = false }: AuthControlsProps) {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [canAccessAdmin, setCanAccessAdmin] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadAuthStatus() {
      try {
        const response = await fetch("/api/auth/status", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { isAdmin?: boolean };
        if (isActive) {
          setCanAccessAdmin(Boolean(data.isAdmin));
        }
      } catch {
        if (isActive) {
          setCanAccessAdmin(false);
        }
      }
    }

    if (isClient) {
      void loadAuthStatus();
    }

    return () => {
      isActive = false;
    };
  }, [isClient]);

  const containerClassName = mobile
    ? "mt-3 flex flex-wrap items-center gap-2 lg:hidden"
    : "hidden items-center gap-2 md:flex";
  const secondaryButtonClassName = mobile
    ? "inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
    : "rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800";
  const primaryButtonClassName = mobile
    ? "inline-flex flex-1 items-center justify-center rounded-full bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
    : "rounded-full bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500";
  const adminButtonClassName = mobile
    ? "inline-flex flex-1 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/60"
    : "rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/60";

  if (!isClient) {
    return <div className={containerClassName} aria-hidden="true" />;
  }

  return (
    <div className={containerClassName}>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button className={secondaryButtonClassName}>
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className={primaryButtonClassName}>
            Sign up
          </button>
        </SignUpButton>
      </Show>

      <Show when="signed-in">
        {canAccessAdmin ? (
          <Link
            href="/admin"
            className={adminButtonClassName}
          >
            Admin
          </Link>
        ) : null}
        <Link
          href="/account"
          className={secondaryButtonClassName}
        >
          Account
        </Link>
        <div className={mobile ? "ml-auto" : ""}>
          <UserButton />
        </div>
      </Show>
    </div>
  );
}
