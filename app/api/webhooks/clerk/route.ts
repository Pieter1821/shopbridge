import { headers } from "next/headers";
import { Webhook } from "svix";

import { createClient } from "@/lib/supabase/admin";

type ClerkWebhookEvent = {
  type: "user.created" | "user.updated" | "user.deleted";
  data: {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string | null;
    public_metadata?: {
      role?: string;
      roles?: string[];
    };
    email_addresses?: Array<{
      email_address?: string;
    }>;
  };
};

export async function POST(req: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 });
  }

  const payload = await req.text();
  const headerPayload = Object.fromEntries((await headers()).entries());

  let event: ClerkWebhookEvent;

  try {
    event = new Webhook(webhookSecret).verify(payload, headerPayload) as ClerkWebhookEvent;
  } catch (error) {
    console.error("Failed to verify Clerk webhook", error);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  try {
    const supabase = createClient();

    if (event.type === "user.created" || event.type === "user.updated") {
      const metadataRoles = Array.isArray(event.data.public_metadata?.roles)
        ? event.data.public_metadata.roles.filter(
            (role): role is "customer" | "admin" | "staff" =>
              role === "customer" || role === "admin" || role === "staff",
          )
        : [];
      const rawRole = event.data.public_metadata?.role;
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
        id: event.data.id,
        email: event.data.email_addresses?.[0]?.email_address,
        first_name: event.data.first_name,
        last_name: event.data.last_name,
        avatar_url: event.data.image_url,
        ...(role ? { role } : {}),
        ...(metadataRoles.length ? { roles: metadataRoles } : {}),
      };

      const { error } = await supabase.from("users").upsert(payload, { onConflict: "id" });

      if (error) {
        console.error("Failed to upsert Clerk user into Supabase", error.message);
        return new Response("Failed to sync user", { status: 500 });
      }
    }

    if (event.type === "user.deleted") {
      const { error } = await supabase.from("users").delete().eq("id", event.data.id);

      if (error) {
        console.error("Failed to delete Clerk user from Supabase", error.message);
        return new Response("Failed to delete user", { status: 500 });
      }
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Unexpected Clerk webhook error", error);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
