"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import { getCurrentUserRoles, isCurrentUserAdmin, type ShopBridgeRole } from "@/lib/auth/current-user";
import { sendManagedUserPasswordEmail, sendManagedUserWelcomeEmail } from "@/lib/email";
import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { normalizeRemoteImageUrl, slugify } from "@/lib/utils";

function parseCurrencyToCents(value: FormDataEntryValue | null) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : 0;
}

function parseOptionalCurrencyToCents(value: FormDataEntryValue | null) {
  if (value == null || String(value).trim() === "") {
    return null;
  }

  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, Math.round(amount * 100)) : null;
}

function parseInteger(value: FormDataEntryValue | null, fallback = 0) {
  const amount = Number(value ?? fallback);
  return Number.isFinite(amount) ? Math.trunc(amount) : fallback;
}

function parseTags(value: FormDataEntryValue | null) {
  return Array.from(
    new Set(
      String(value ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

async function assertAdminAccess() {
  const isAdmin = await isCurrentUserAdmin();

  if (!isAdmin) {
    throw new Error("Unauthorized admin action.");
  }
}

async function assertUserManagementAccess() {
  const { roles, primaryRole } = await getCurrentUserRoles();

  if (!roles.includes("admin") && primaryRole !== "admin") {
    throw new Error("Only admin users can manage staff and customer accounts.");
  }
}

async function uploadImageFromFormData(file: FormDataEntryValue | null, folder: string) {
  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  const supabase = createAdminClient();
  const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
  const path = `${folder}/${Date.now()}-${filename}.${fileExtension}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabase.storage.from("product-images").upload(path, bytes, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

async function resolveImageUrl({
  file,
  url,
  existing,
  folder,
}: {
  file: FormDataEntryValue | null;
  url: FormDataEntryValue | null;
  existing?: FormDataEntryValue | null;
  folder: string;
}) {
  const uploadedImage = await uploadImageFromFormData(file, folder);

  if (uploadedImage) {
    return uploadedImage;
  }

  const directUrl = String(url ?? "").trim();
  const normalizedDirectUrl = normalizeRemoteImageUrl(directUrl);

  if (directUrl) {
    if (!normalizedDirectUrl) {
      throw new Error("Please paste a direct image URL instead of a search results page.");
    }

    return normalizedDirectUrl;
  }

  const existingUrl = String(existing ?? "").trim();
  return normalizeRemoteImageUrl(existingUrl);
}

function revalidateStorefront() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/search");
  revalidatePath("/admin");
}

function redirectToAdminUserManagement(params: { success?: string; error?: string }) {
  const searchParams = new URLSearchParams();

  if (params.success) {
    searchParams.set("userSuccess", params.success);
  }

  if (params.error) {
    searchParams.set("userError", params.error);
  }

  const query = searchParams.toString();
  redirect(query ? `/admin?${query}#user-management` : "/admin#user-management");
}

function getManagedRole(value: string): ShopBridgeRole {
  if (value === "admin") {
    return "admin";
  }

  if (value === "staff") {
    return "staff";
  }

  return "customer";
}

function getManagedRoles(role: ShopBridgeRole): ShopBridgeRole[] {
  if (role === "admin") {
    return ["customer", "admin"];
  }

  if (role === "staff") {
    return ["customer", "staff"];
  }

  return ["customer"];
}

function getActionErrorMessage(error: unknown, fallback: string) {
  const details = error as {
    errors?: Array<{ longMessage?: string; message?: string }>;
    message?: string;
  };

  return (
    details?.errors?.[0]?.longMessage ??
    details?.errors?.[0]?.message ??
    details?.message ??
    fallback
  );
}

async function syncManagedUserProfile({
  currentId,
  nextId,
  email,
  firstName,
  lastName,
  phone,
  avatarUrl,
  role,
  marketingOptIn,
  roles,
}: {
  currentId?: string | null;
  nextId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  role: ShopBridgeRole;
  marketingOptIn: boolean;
  roles: ShopBridgeRole[];
}) {
  const supabase = createAdminClient();
  const payload = {
    id: nextId,
    email,
    first_name: firstName || null,
    last_name: lastName || null,
    phone: phone || null,
    avatar_url: avatarUrl || null,
    role,
    marketing_opt_in: marketingOptIn,
    roles,
  };

  if (!currentId || currentId === nextId) {
    const { error } = await supabase.from("users").upsert(payload, { onConflict: "id" });

    if (error) {
      throw new Error(`Unable to sync the user to Supabase: ${error.message}`);
    }

    return;
  }

  const { error: directUpdateError } = await supabase
    .from("users")
    .update(payload)
    .eq("id", currentId);

  if (!directUpdateError) {
    return;
  }

  const legacyEmail = `${email}__legacy_${Date.now()}`;
  const { error: legacyEmailError } = await supabase
    .from("users")
    .update({ email: legacyEmail })
    .eq("id", currentId);

  if (legacyEmailError) {
    throw new Error(`Unable to migrate the existing user profile: ${legacyEmailError.message}`);
  }

  const { error: insertError } = await supabase.from("users").upsert(payload, { onConflict: "id" });

  if (insertError) {
    await supabase.from("users").update({ email }).eq("id", currentId);
    throw new Error(`Unable to sync the user to Supabase: ${insertError.message}`);
  }

  const userLinkUpdates: Array<{ table: string; column: string }> = [
    { table: "addresses", column: "user_id" },
    { table: "carts", column: "user_id" },
    { table: "wishlists", column: "user_id" },
    { table: "orders", column: "user_id" },
    { table: "order_status_history", column: "changed_by" },
  ];

  for (const link of userLinkUpdates) {
    await supabase
      .from(link.table)
      .update({ [link.column]: nextId } as never)
      .eq(link.column, currentId);
  }

  await supabase.from("users").delete().eq("id", currentId);
}

export async function createProductAction(formData: FormData) {
  await assertAdminAccess();

  const supabase = createAdminClient();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new Error("Product name is required.");
  }

  const imageUrl = await resolveImageUrl({
    file: formData.get("image"),
    url: formData.get("image_url"),
    folder: "admin/products",
  });

  const baseSlug = slugify(name);
  const slug = `${baseSlug || "product"}-${Date.now().toString(36)}`;
  const skuInput = String(formData.get("sku") ?? "").trim();
  const priceCents = parseCurrencyToCents(formData.get("price"));
  const compareAtInput = parseOptionalCurrencyToCents(formData.get("compare_at_price"));
  const compareAtPriceCents = compareAtInput !== null && compareAtInput >= priceCents ? compareAtInput : null;

  const { error } = await supabase.from("products").insert({
    name,
    slug,
    brand: String(formData.get("brand") ?? "").trim() || null,
    sku: skuInput || `SB-${Date.now().toString(36).toUpperCase()}`,
    description: String(formData.get("description") ?? "").trim() || null,
    category_id: String(formData.get("category_id") ?? "").trim() || null,
    price_cents: priceCents,
    compare_at_price_cents: compareAtPriceCents,
    stock_quantity: parseInteger(formData.get("stock_quantity"), 0),    low_stock_threshold: parseInteger(formData.get("low_stock_threshold"), 3),
    images: imageUrl ? [imageUrl] : [],
    tags: parseTags(formData.get("tags")),
    is_active: formData.get("is_active") === "on",
    is_featured: formData.get("is_featured") === "on",
  });

  if (error) {
    throw new Error(`Unable to create product: ${error.message}`);
  }

  revalidateStorefront();
}

export async function updateProductAction(formData: FormData) {
  await assertAdminAccess();

  const supabase = createAdminClient();
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!id || !name) {
    throw new Error("Product ID and name are required.");
  }

  const imageUrl = await resolveImageUrl({
    file: formData.get("image"),
    url: formData.get("image_url"),
    existing: formData.get("existing_image_url"),
    folder: "admin/products",
  });

  const priceCents = parseCurrencyToCents(formData.get("price"));
  const compareAtInput = parseOptionalCurrencyToCents(formData.get("compare_at_price"));
  const compareAtPriceCents = compareAtInput !== null && compareAtInput >= priceCents ? compareAtInput : null;

  const payload = {
    name,
    slug: String(formData.get("slug") ?? "").trim() || slugify(name),
    brand: String(formData.get("brand") ?? "").trim() || null,
    sku: String(formData.get("sku") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    category_id: String(formData.get("category_id") ?? "").trim() || null,
    price_cents: priceCents,
    compare_at_price_cents: compareAtPriceCents,
    stock_quantity: parseInteger(formData.get("stock_quantity"), 0),
    low_stock_threshold: parseInteger(formData.get("low_stock_threshold"), 3),
    tags: parseTags(formData.get("tags")),
    is_active: formData.get("is_active") === "on",
    is_featured: formData.get("is_featured") === "on",
    ...(imageUrl ? { images: [imageUrl] } : {}),
  };

  const { error } = await supabase.from("products").update(payload).eq("id", id);

  if (error) {
    throw new Error(`Unable to update product: ${error.message}`);
  }

  revalidateStorefront();
}

export async function deleteProductAction(formData: FormData) {
  await assertAdminAccess();

  const supabase = createAdminClient();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    throw new Error("Product ID is required.");
  }

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    throw new Error(`Unable to delete product: ${error.message}`);
  }

  revalidateStorefront();
}

export async function createCategoryAction(formData: FormData) {
  await assertAdminAccess();

  const supabase = createAdminClient();
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new Error("Category name is required.");
  }

  const imageUrl = await resolveImageUrl({
    file: formData.get("image"),
    url: formData.get("image_url"),
    folder: "admin/categories",
  });

  const slugInput = String(formData.get("slug") ?? "").trim();
  const { error } = await supabase.from("categories").insert({
    name,
    slug: slugInput || slugify(name),
    description: String(formData.get("description") ?? "").trim() || null,
    image_url: imageUrl,
    parent_id: String(formData.get("parent_id") ?? "").trim() || null,
    sort_order: parseInteger(formData.get("sort_order"), 0),
    is_active: formData.get("is_active") === "on",
  });

  if (error) {
    throw new Error(`Unable to create category: ${error.message}`);
  }

  revalidateStorefront();
}

export async function updateCategoryAction(formData: FormData) {
  await assertAdminAccess();

  const supabase = createAdminClient();
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!id || !name) {
    throw new Error("Category ID and name are required.");
  }

  const imageUrl = await resolveImageUrl({
    file: formData.get("image"),
    url: formData.get("image_url"),
    existing: formData.get("existing_image_url"),
    folder: "admin/categories",
  });

  const payload = {
    name,
    slug: String(formData.get("slug") ?? "").trim() || slugify(name),
    description: String(formData.get("description") ?? "").trim() || null,
    image_url: imageUrl,
    parent_id: String(formData.get("parent_id") ?? "").trim() || null,
    sort_order: parseInteger(formData.get("sort_order"), 0),
    is_active: formData.get("is_active") === "on",
  };

  const { error } = await supabase.from("categories").update(payload).eq("id", id);

  if (error) {
    throw new Error(`Unable to update category: ${error.message}`);
  }

  revalidateStorefront();
}

export async function deleteCategoryAction(formData: FormData) {
  await assertAdminAccess();

  const supabase = createAdminClient();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    throw new Error("Category ID is required.");
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    throw new Error(`Unable to delete category: ${error.message}`);
  }

  revalidateStorefront();
}

export async function createManagedUserAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const temporaryPassword = String(formData.get("temporary_password") ?? "").trim();
  const marketingOptIn = formData.get("marketing_opt_in") === "on";
  const requestedRole = String(formData.get("role") ?? "customer").trim();
  const role = getManagedRole(requestedRole);
  const roles = getManagedRoles(role);

  try {
    await assertUserManagementAccess();

    if (!email) {
      throw new Error("Email is required.");
    }

    if (temporaryPassword.length < 8) {
      throw new Error("Temporary password must be at least 8 characters long.");
    }

    const client = await clerkClient();
    const existingClerkUsers = await client.users.getUserList({
      emailAddress: [email],
      limit: 1,
    });
    const existingClerkUser = existingClerkUsers.data[0] ?? null;

    const managedUser = existingClerkUser
      ? await client.users.updateUser(existingClerkUser.id, {
          password: temporaryPassword,
          signOutOfOtherSessions: true,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          publicMetadata: {
            role,
            roles,
          },
        })
      : await client.users.createUser({
          emailAddress: [email],
          password: temporaryPassword,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          publicMetadata: {
            role,
            roles,
          },
        });

    const primaryEmail = managedUser.emailAddresses.find(
      (address) => address.id === managedUser.primaryEmailAddressId,
    )?.emailAddress ?? email;

    const supabase = createAdminClient();
    const { data: existingProfile } = await supabase
      .from("users")
      .select("id, phone, marketing_opt_in")
      .eq("email", primaryEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    await syncManagedUserProfile({
      currentId: existingProfile?.id ?? null,
      nextId: managedUser.id,
      email: primaryEmail,
      firstName: managedUser.firstName ?? firstName ?? null,
      lastName: managedUser.lastName ?? lastName ?? null,
      phone: phone || existingProfile?.phone || null,
      avatarUrl: managedUser.imageUrl ?? null,
      role,
      marketingOptIn: marketingOptIn || Boolean(existingProfile?.marketing_opt_in),
      roles,
    });

    try {
      await sendManagedUserWelcomeEmail({
        email: primaryEmail,
        firstName,
        lastName,
        role,
        temporaryPassword,
      });
    } catch (emailError) {
      console.error("Failed to send new account email", emailError);
    }

    revalidatePath("/admin");
    redirectToAdminUserManagement({
      success: existingClerkUser
        ? `${primaryEmail} is ready to sign in.`
        : `${primaryEmail} was created successfully.`,
    });
  } catch (error) {
    unstable_rethrow(error);

    redirectToAdminUserManagement({
      error: getActionErrorMessage(error, "Unable to create the user account."),
    });
  }
}

export async function changeManagedUserPasswordAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const requestedRole = String(formData.get("primary_role") ?? "customer").trim();
  const role = getManagedRole(requestedRole);
  const roles = getManagedRoles(role);
  const nextPassword = String(formData.get("new_password") ?? "").trim();

  try {
    await assertUserManagementAccess();

    if (!email) {
      throw new Error("Email is required.");
    }

    if (nextPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long.");
    }

    const supabase = createAdminClient();
    const { data: existingProfile } = await supabase
      .from("users")
      .select("id, phone, marketing_opt_in")
      .eq("id", id)
      .maybeSingle();

    const client = await clerkClient();
    let managedUser = null;

    if (id.startsWith("user_")) {
      try {
        managedUser = await client.users.getUser(id);
      } catch {
        managedUser = null;
      }
    }

    if (!managedUser) {
      const matchedUsers = await client.users.getUserList({
        emailAddress: [email],
        limit: 1,
      });
      managedUser = matchedUsers.data[0] ?? null;
    }

    const syncedUser = managedUser
      ? await client.users.updateUser(managedUser.id, {
          password: nextPassword,
          signOutOfOtherSessions: true,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          publicMetadata: {
            role,
            roles,
          },
        })
      : await client.users.createUser({
          emailAddress: [email],
          password: nextPassword,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          publicMetadata: {
            role,
            roles,
          },
        });

    await syncManagedUserProfile({
      currentId: existingProfile?.id ?? id ?? null,
      nextId: syncedUser.id,
      email,
      firstName: syncedUser.firstName ?? firstName ?? null,
      lastName: syncedUser.lastName ?? lastName ?? null,
      phone: existingProfile?.phone ?? null,
      avatarUrl: syncedUser.imageUrl ?? null,
      role,
      marketingOptIn: Boolean(existingProfile?.marketing_opt_in),
      roles,
    });

    try {
      await sendManagedUserPasswordEmail({
        email,
        firstName,
        lastName,
        role,
        temporaryPassword: nextPassword,
      });
    } catch (emailError) {
      console.error("Failed to send password update email", emailError);
    }

    revalidatePath("/admin");
    redirectToAdminUserManagement({ success: `Password updated for ${email}.` });
  } catch (error) {
    unstable_rethrow(error);

    redirectToAdminUserManagement({
      error: getActionErrorMessage(error, "Unable to update the password."),
    });
  }
}

export async function updateUserRolesAction(formData: FormData) {
  const supabase = createAdminClient();
  const id = String(formData.get("id") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();

  try {
    await assertUserManagementAccess();

    if (!id) {
      throw new Error("User ID is required.");
    }

    const selectedRoles = formData
      .getAll("roles")
      .map((value) => String(value))
      .filter((value): value is ShopBridgeRole => value === "customer" || value === "admin" || value === "staff");

    const roles: ShopBridgeRole[] = Array.from(
      new Set<ShopBridgeRole>(selectedRoles.length ? selectedRoles : ["customer"]),
    );

    if ((roles.includes("admin") || roles.includes("staff")) && !roles.includes("customer")) {
      roles.unshift("customer");
    }

    const primaryRole: ShopBridgeRole = roles.includes("admin")
      ? "admin"
      : roles.includes("staff")
        ? "staff"
        : "customer";

    let nextId = id;

    if (email) {
      const client = await clerkClient();
      let managedUser = null;

      if (id.startsWith("user_")) {
        try {
          managedUser = await client.users.getUser(id);
        } catch {
          managedUser = null;
        }
      }

      if (!managedUser) {
        const matchedUsers = await client.users.getUserList({
          emailAddress: [email],
          limit: 1,
        });
        managedUser = matchedUsers.data[0] ?? null;
      }

      if (managedUser) {
        const updatedUser = await client.users.updateUser(managedUser.id, {
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          publicMetadata: {
            role: primaryRole,
            roles,
          },
        });

        nextId = updatedUser.id;

        const { data: existingProfile } = await supabase
          .from("users")
          .select("phone, marketing_opt_in")
          .eq("id", id)
          .maybeSingle();

        await syncManagedUserProfile({
          currentId: id,
          nextId,
          email,
          firstName: updatedUser.firstName ?? firstName ?? null,
          lastName: updatedUser.lastName ?? lastName ?? null,
          phone: existingProfile?.phone ?? null,
          avatarUrl: updatedUser.imageUrl ?? null,
          role: primaryRole,
          marketingOptIn: Boolean(existingProfile?.marketing_opt_in),
          roles,
        });
      }
    }

    const { error } = await supabase.from("users").update({
      role: primaryRole,
      roles,
    }).eq("id", nextId);

    if (error) {
      throw new Error(`Unable to update user roles: ${error.message}`);
    }

    revalidatePath("/admin");
    redirectToAdminUserManagement({ success: "User roles updated successfully." });
  } catch (error) {
    unstable_rethrow(error);

    redirectToAdminUserManagement({
      error: getActionErrorMessage(error, "Unable to update user roles."),
    });
  }
}
