import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

function getPublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY
  );
}

export async function createClient(accessToken?: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = getPublicKey();

  if (!url || !publicKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  const cookieStore = await cookies();

  return createServerClient(url, publicKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => undefined,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

export function createReadonlyClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = getPublicKey();

  if (!url || !publicKey) {
    throw new Error("Missing Supabase public environment variables.");
  }

  return createSupabaseClient(url, publicKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
