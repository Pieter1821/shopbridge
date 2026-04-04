"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

const emptySubscribe = () => () => undefined;

export function AuthControls() {
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

  if (!isClient) {
    return <div className="hidden items-center gap-2 md:flex" aria-hidden="true" />;
  }

  return (
    <div className="hidden items-center gap-2 md:flex">
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="rounded-full bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
            Sign up
          </button>
        </SignUpButton>
      </Show>

      <Show when="signed-in">
        {canAccessAdmin ? (
          <Link
            href="/admin"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
          >
            Admin
          </Link>
        ) : null}
        <Link
          href="/account"
          className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Account
        </Link>
        <UserButton />
      </Show>
    </div>
  );
}
