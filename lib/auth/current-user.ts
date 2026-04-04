import { auth } from "@clerk/nextjs/server";

import { createClient as createAdminClient } from "@/lib/supabase/admin";

export type ShopBridgeRole = "customer" | "admin" | "staff";

const knownRoles: ShopBridgeRole[] = ["customer", "admin", "staff"];

function normalizeRoles(input: unknown, fallbackRole: ShopBridgeRole | null) {
  const values = Array.isArray(input) ? input : input ? [input] : [];
  const roles = values.filter(
    (value): value is ShopBridgeRole => typeof value === "string" && knownRoles.includes(value as ShopBridgeRole),
  );

  if (fallbackRole && !roles.includes(fallbackRole)) {
    roles.unshift(fallbackRole);
  }

  return Array.from(new Set(roles));
}

export async function getCurrentUserRoles(): Promise<{
  userId: string | null;
  primaryRole: ShopBridgeRole | null;
  roles: ShopBridgeRole[];
}> {
  const { userId } = await auth();

  if (!userId) {
    return { userId: null, primaryRole: null, roles: [] };
  }

  try {
    const supabase = createAdminClient();
    const detailedResult = await supabase
      .from("users")
      .select("role, roles")
      .eq("id", userId)
      .maybeSingle();

    if (!detailedResult.error) {
      const primaryRole = knownRoles.includes(detailedResult.data?.role as ShopBridgeRole)
        ? (detailedResult.data?.role as ShopBridgeRole)
        : null;
      const roles = normalizeRoles(detailedResult.data?.roles, primaryRole);

      return {
        userId,
        primaryRole: primaryRole ?? roles[0] ?? null,
        roles,
      };
    }

    const fallbackResult = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (fallbackResult.error) {
      console.error("Failed to load current user role", fallbackResult.error.message);
      return { userId, primaryRole: null, roles: [] };
    }

    const primaryRole = knownRoles.includes(fallbackResult.data?.role as ShopBridgeRole)
      ? (fallbackResult.data?.role as ShopBridgeRole)
      : null;
    const roles = primaryRole ? [primaryRole] : [];

    return { userId, primaryRole, roles };
  } catch (error) {
    console.error("Unable to check current user role", error);
    return { userId, primaryRole: null, roles: [] };
  }
}

export async function getCurrentUserRole(): Promise<ShopBridgeRole | null> {
  const { primaryRole } = await getCurrentUserRoles();
  return primaryRole;
}

export async function isCurrentUserAdmin() {
  const { roles, primaryRole } = await getCurrentUserRoles();
  return roles.includes("admin") || roles.includes("staff") || primaryRole === "admin" || primaryRole === "staff";
}
