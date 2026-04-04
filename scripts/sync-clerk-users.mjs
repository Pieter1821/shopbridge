import { createClient } from "@supabase/supabase-js";

const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!clerkSecretKey || !supabaseUrl || !serviceRoleKey) {
  console.error("Missing CLERK_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function fetchClerkUsers() {
  const response = await fetch("https://api.clerk.com/v1/users?limit=100", {
    headers: {
      Authorization: `Bearer ${clerkSecretKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Clerk API error ${response.status}: ${text}`);
  }

  return response.json();
}

async function main() {
  const users = await fetchClerkUsers();

  if (!Array.isArray(users) || users.length === 0) {
    console.log("No Clerk users found to sync.");
    return;
  }

  const rows = users
    .map((user) => {
      const metadataRoles = Array.isArray(user.public_metadata?.roles)
        ? user.public_metadata.roles.filter(
            (role) => role === "customer" || role === "admin" || role === "staff",
          )
        : [];
      const rawRole = user.public_metadata?.role;
      const role = rawRole === "admin" || rawRole === "staff" || rawRole === "customer"
        ? rawRole
        : metadataRoles.includes("admin")
          ? "admin"
          : metadataRoles.includes("staff")
            ? "staff"
            : metadataRoles.includes("customer")
              ? "customer"
              : null;

      if ((metadataRoles.includes("admin") || metadataRoles.includes("staff")) && !metadataRoles.includes("customer")) {
        metadataRoles.unshift("customer");
      }

      return {
        id: user.id,
        email: user.email_addresses?.find((email) => email.id === user.primary_email_address_id)?.email_address
          ?? user.email_addresses?.[0]?.email_address
          ?? null,
        first_name: user.first_name ?? null,
        last_name: user.last_name ?? null,
        phone: user.phone_numbers?.[0]?.phone_number ?? null,
        avatar_url: user.image_url ?? null,
        ...(role ? { role } : {}),
        ...(metadataRoles.length ? { roles: metadataRoles } : {}),
      };
    })
    .filter((user) => user.email);

  const { error } = await supabase.from("users").upsert(rows, { onConflict: "id" });

  if (error) {
    throw new Error(`Supabase upsert failed: ${error.message}`);
  }

  console.log(`Synced ${rows.length} Clerk user(s) to public.users.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
