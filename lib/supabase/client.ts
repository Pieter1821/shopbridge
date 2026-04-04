import { createBrowserClient } from "@supabase/ssr";

function getPublicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY
  );
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = getPublicKey();

  if (!url || !publicKey) {
    throw new Error("Missing Supabase browser environment variables.");
  }

  return createBrowserClient(url, publicKey);
}
