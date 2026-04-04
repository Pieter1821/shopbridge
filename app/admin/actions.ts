"use server";

import { revalidatePath } from "next/cache";

import { isCurrentUserAdmin, type ShopBridgeRole } from "@/lib/auth/current-user";
import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

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
  if (directUrl) {
    return directUrl;
  }

  const existingUrl = String(existing ?? "").trim();
  return existingUrl || null;
}

function revalidateStorefront() {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/search");
  revalidatePath("/admin");
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

export async function updateUserRolesAction(formData: FormData) {
  await assertAdminAccess();

  const supabase = createAdminClient();
  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    throw new Error("User ID is required.");
  }

  const selectedRoles = formData
    .getAll("roles")
    .map((value) => String(value))
    .filter((value): value is ShopBridgeRole => value === "customer" || value === "admin" || value === "staff");

  const roles = Array.from(new Set(selectedRoles.length ? selectedRoles : ["customer"]));

  if ((roles.includes("admin") || roles.includes("staff")) && !roles.includes("customer")) {
    roles.unshift("customer");
  }

  const primaryRole: ShopBridgeRole = roles.includes("admin")
    ? "admin"
    : roles.includes("staff")
      ? "staff"
      : "customer";

  const { error } = await supabase.from("users").update({
    role: primaryRole,
    roles,
  }).eq("id", id);

  if (error) {
    throw new Error(`Unable to update user roles: ${error.message}`);
  }

  revalidatePath("/admin");
}
