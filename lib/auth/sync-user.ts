import { currentUser } from "@clerk/nextjs/server";

import { createClient as createAdminClient } from "@/lib/supabase/admin";

export async function syncCurrentUserToSupabase() {
  const user = await currentUser();

  if (!user) {
    return null;
  }

  const primaryEmail =
    user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    null;

  if (!primaryEmail) {
    console.warn("Clerk user is missing a primary email; skipping Supabase sync.");
    return null;
  }

  try {
    const supabase = createAdminClient();
    const metadataRoles = Array.isArray(user.publicMetadata?.roles)
      ? user.publicMetadata.roles.filter(
          (role): role is "customer" | "admin" | "staff" =>
            role === "customer" || role === "admin" || role === "staff",
        )
      : [];
    const rawRole = user.publicMetadata?.role;
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

    const payload = {
      id: user.id,
      email: primaryEmail,
      first_name: user.firstName,
      last_name: user.lastName,
      phone: user.phoneNumbers[0]?.phoneNumber ?? null,
      avatar_url: user.imageUrl,
      ...(role ? { role } : {}),
      ...(metadataRoles.length ? { roles: metadataRoles } : {}),
    };

    const { error } = await supabase.from("users").upsert(payload, { onConflict: "id" });

    if (error) {
      console.error("Failed to sync Clerk user to Supabase", error.message);
      return null;
    }

    return { id: user.id, email: primaryEmail };
  } catch (error) {
    console.warn(
      "Clerk user sync skipped. Add SUPABASE_SERVICE_ROLE_KEY to .env.local to persist users in Supabase.",
      error,
    );
    return null;
  }
}
