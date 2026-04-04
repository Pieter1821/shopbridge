import { NextResponse } from "next/server";

import { getCurrentUserRoles } from "@/lib/auth/current-user";

export async function GET() {
  const { userId, roles, primaryRole } = await getCurrentUserRoles();
  const isAdmin = roles.includes("admin") || roles.includes("staff");

  return NextResponse.json({
    signedIn: Boolean(userId),
    primaryRole,
    roles,
    isAdmin,
  });
}
