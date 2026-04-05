import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, Boxes, ImageOff, ShieldCheck, Tags, Users } from "lucide-react";

import { getCurrentUserRoles, type ShopBridgeRole } from "@/lib/auth/current-user";
import { createClient as createAdminClient } from "@/lib/supabase/admin";
import { formatZAR } from "@/lib/utils";

import {
  createCategoryAction,
  createProductAction,
  deleteCategoryAction,
  deleteProductAction,
  updateCategoryAction,
  updateProductAction,
  createManagedUserAction,
  updateUserRolesAction,
} from "./actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;
const availableRoles: ShopBridgeRole[] = ["customer", "admin", "staff"];
const productFilters = ["all", "attention", "missing-image", "low-stock", "uncategorized", "inactive"] as const;
type ProductFilter = (typeof productFilters)[number];

type AdminCategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
};

type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  sku: string | null;
  description: string | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  is_featured: boolean;
  images: string[] | string | null;
  tags: string[] | string | null;
  category_id: string | null;
  categories: { name: string } | { name: string }[] | null;
};

type AdminUserRow = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: ShopBridgeRole | null;
  roles: ShopBridgeRole[] | null;
  created_at: string;
};

type AdminPageProps = {
  searchParams?: Promise<{ filter?: string; page?: string }>;
};

function normalizeStringList(value: string[] | string | null | undefined) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean)));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return Array.from(new Set(parsed.map((item) => String(item).trim()).filter(Boolean)));
      }
    } catch {
      if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        return Array.from(
          new Set(
            trimmed
              .slice(1, -1)
              .split(",")
              .map((item) => item.replace(/^"|"$/g, "").trim())
              .filter(Boolean),
          ),
        );
      }
    }

    return [trimmed];
  }

  return [];
}

function getCategoryName(category: AdminProductRow["categories"]) {
  if (Array.isArray(category)) {
    return category[0]?.name ?? "Uncategorised";
  }

  return category?.name ?? "Uncategorised";
}

function getUserRoles(user: AdminUserRow) {
  const roles = Array.from(new Set([...(user.roles ?? []), ...(user.role ? [user.role] : [])]));
  return roles.length ? roles : ["customer"];
}

function getProductIssues(product: AdminProductRow) {
  const imageCount = normalizeStringList(product.images).length;
  const issues: Array<{ label: string; tone: string }> = [];

  if (imageCount === 0) {
    issues.push({ label: "Missing image", tone: "bg-amber-50 text-amber-800 border-amber-200" });
  }

  if (product.stock_quantity <= product.low_stock_threshold) {
    issues.push({ label: "Low stock", tone: "bg-rose-50 text-rose-700 border-rose-200" });
  }

  if (!product.category_id) {
    issues.push({ label: "No category", tone: "bg-sky-50 text-sky-700 border-sky-200" });
  }

  if (!product.is_active) {
    issues.push({ label: "Inactive", tone: "bg-slate-100 text-slate-700 border-slate-200" });
  }

  return issues;
}

function matchesFilter(product: AdminProductRow, filter: ProductFilter) {
  const hasImage = normalizeStringList(product.images).length > 0;
  const isLowStock = product.stock_quantity <= product.low_stock_threshold;

  switch (filter) {
    case "attention":
      return !hasImage || isLowStock || !product.category_id || !product.is_active;
    case "missing-image":
      return !hasImage;
    case "low-stock":
      return isLowStock;
    case "uncategorized":
      return !product.category_id;
    case "inactive":
      return !product.is_active;
    default:
      return true;
  }
}

function buildAdminHref(filter: ProductFilter, page = 1) {
  const params = new URLSearchParams();

  if (filter !== "all") {
    params.set("filter", filter);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/admin?${query}` : "/admin";
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/account");
  }

  const { roles } = await getCurrentUserRoles();
  const isAdmin = roles.includes("admin") || roles.includes("staff");
  const canManageUsers = roles.includes("admin");

  if (!isAdmin) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">
            Admin access required
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Your account is signed in, but it does not have dashboard access.
          </h1>
          <p className="mt-3 text-slate-600">
            Ask an existing admin to grant your account the <code>admin</code> role in <code>public.users</code>.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {roles.map((role) => (
              <span key={role} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
                {role}
              </span>
            ))}
          </div>
          <div className="mt-6">
            <Link href="/" className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
              Back to store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const rawSearchParams = searchParams ? await searchParams : {};
  const currentFilter = productFilters.includes((rawSearchParams?.filter as ProductFilter) ?? "all")
    ? ((rawSearchParams?.filter as ProductFilter) ?? "all")
    : "all";
  const requestedPage = Number.parseInt(rawSearchParams?.page ?? "1", 10);

  const supabase = createAdminClient();
  const [productsResult, categoriesResult, usersResult, userCountResult, adminCountResult] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, slug, brand, sku, description, price_cents, compare_at_price_cents, stock_quantity, low_stock_threshold, is_active, is_featured, images, tags, category_id, categories(name)",
      )
      .order("is_featured", { ascending: false })
      .order("updated_at", { ascending: false }),
    supabase
      .from("categories")
      .select("id, name, slug, description, image_url, parent_id, sort_order, is_active")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("users")
      .select("id, email, first_name, last_name, role, roles, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }).in("role", ["admin", "staff"]),
  ]);

  const products = (productsResult.data ?? []) as AdminProductRow[];
  const categories = (categoriesResult.data ?? []) as AdminCategoryRow[];
  const users = (usersResult.data ?? []) as AdminUserRow[];
  const totalProducts = products.length;
  const totalCategories = categories.length;
  const totalUsers = userCountResult.count ?? users.length;
  const totalAdmins = adminCountResult.count ?? users.filter((user) => getUserRoles(user).some((role) => role === "admin" || role === "staff")).length;
  const loadErrors = [
    productsResult.error?.message,
    categoriesResult.error?.message,
    usersResult.error?.message,
    userCountResult.error?.message,
    adminCountResult.error?.message,
  ].filter(Boolean);

  const categoryCounts = new Map<string, number>();
  for (const product of products) {
    if (product.category_id) {
      categoryCounts.set(product.category_id, (categoryCounts.get(product.category_id) ?? 0) + 1);
    }
  }

  const issueCounts = {
    attention: products.filter((product) => getProductIssues(product).length > 0).length,
    missingImage: products.filter((product) => normalizeStringList(product.images).length === 0).length,
    lowStock: products.filter((product) => product.stock_quantity <= product.low_stock_threshold).length,
    uncategorized: products.filter((product) => !product.category_id).length,
    inactive: products.filter((product) => !product.is_active).length,
  };

  const filteredProducts = products.filter((product) => matchesFilter(product, currentFilter));
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const visibleProducts = filteredProducts.slice(startIndex, startIndex + PAGE_SIZE);
  const pageStart = filteredProducts.length ? startIndex + 1 : 0;
  const pageEnd = filteredProducts.length ? Math.min(startIndex + PAGE_SIZE, filteredProducts.length) : 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-700">
          Admin CRM
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          Store operations dashboard
        </h1>
        <p className="mt-3 max-w-3xl text-slate-600">
          Focus on what needs attention first: images, stock, categories, and access control. The live storefront only merchandises products that have working images.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Products", value: totalProducts, icon: Boxes },
            { label: "Categories", value: totalCategories, icon: Tags },
            { label: "Admins & staff", value: totalAdmins, icon: ShieldCheck },
            { label: "Users synced", value: totalUsers, icon: Users },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-600">{item.label}</p>
                  <span className="rounded-2xl bg-white p-2 text-slate-700 shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-black tracking-tight text-slate-950">{item.value}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Needs attention", value: issueCounts.attention, href: buildAdminHref("attention"), tone: "border-amber-200 bg-amber-50 text-amber-900", icon: AlertTriangle },
            { label: "Missing images", value: issueCounts.missingImage, href: buildAdminHref("missing-image"), tone: "border-rose-200 bg-rose-50 text-rose-700", icon: ImageOff },
            { label: "Low stock", value: issueCounts.lowStock, href: buildAdminHref("low-stock"), tone: "border-orange-200 bg-orange-50 text-orange-800", icon: AlertTriangle },
            { label: "Uncategorised", value: issueCounts.uncategorized, href: buildAdminHref("uncategorized"), tone: "border-sky-200 bg-sky-50 text-sky-800", icon: Tags },
          ].map((signal) => {
            const Icon = signal.icon;
            return (
              <Link key={signal.label} href={signal.href} className={`rounded-3xl border p-4 transition hover:-translate-y-0.5 ${signal.tone}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">{signal.label}</p>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="mt-3 text-2xl font-black">{signal.value}</p>
              </Link>
            );
          })}
        </div>

        {loadErrors.length ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {loadErrors.join(" • ")}
          </div>
        ) : null}
      </section>

      <section className="mt-8 grid gap-8 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">Products management</h2>
              <p className="mt-2 text-sm text-slate-600">
                Showing {pageStart}-{pageEnd} of {filteredProducts.length} products for the <span className="font-semibold">{currentFilter.replace("-", " ")}</span> view.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All", count: totalProducts },
                { key: "attention", label: "Needs attention", count: issueCounts.attention },
                { key: "missing-image", label: "No image", count: issueCounts.missingImage },
                { key: "low-stock", label: "Low stock", count: issueCounts.lowStock },
                { key: "uncategorized", label: "No category", count: issueCounts.uncategorized },
                { key: "inactive", label: "Inactive", count: issueCounts.inactive },
              ].map((filterItem) => {
                const active = currentFilter === filterItem.key;
                return (
                  <Link
                    key={filterItem.key}
                    href={buildAdminHref(filterItem.key as ProductFilter, 1)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
                      active ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{filterItem.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-700"}`}>
                      {filterItem.count}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {visibleProducts.length ? (
              visibleProducts.map((product) => {
                const imageUrl = normalizeStringList(product.images)[0] ?? "";
                const tags = normalizeStringList(product.tags).join(", ");
                const issues = getProductIssues(product);

                return (
                  <details key={product.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50/60">
                    <summary className="cursor-pointer list-none p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-slate-100">
                            {imageUrl ? (
                              <Image src={imageUrl} alt={product.name} fill sizes="80px" className="object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-[11px] font-medium text-slate-500">
                                No image
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-slate-950">{product.name}</p>
                            <p className="text-sm text-slate-500">
                              {product.brand ?? "ShopBridge"} • {getCategoryName(product.categories)} • {product.sku ?? "No SKU"}
                            </p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm">
                                {formatZAR(product.price_cents)}
                              </span>
                              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm">
                                Stock {product.stock_quantity}
                              </span>
                              {product.is_featured ? (
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                                  Featured
                                </span>
                              ) : null}
                              {issues.map((issue) => (
                                <span key={issue.label} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${issue.tone}`}>
                                  {issue.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-slate-500">Open editor</span>
                      </div>
                    </summary>

                    <div className="border-t border-slate-200 bg-white p-4">
                      <form action={updateProductAction} className="grid gap-4 xl:grid-cols-[120px_1fr]">
                        <div className="space-y-3">
                          <div className="relative h-28 overflow-hidden rounded-2xl bg-slate-100">
                            {imageUrl ? (
                              <Image src={imageUrl} alt={product.name} fill sizes="120px" className="object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-slate-500">Missing image</div>
                            )}
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                            Customer-facing products need a real image to appear in the storefront.
                          </div>
                        </div>

                        <div className="space-y-4">
                          <input type="hidden" name="id" value={product.id} />
                          <input type="hidden" name="existing_image_url" value={imageUrl} />

                          <div className="grid gap-4 md:grid-cols-2">
                            <label className="space-y-2 text-sm font-medium text-slate-700">
                              Name
                              <input name="name" defaultValue={product.name} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                            </label>
                            <label className="space-y-2 text-sm font-medium text-slate-700">
                              Slug
                              <input name="slug" defaultValue={product.slug} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                            </label>
                            <label className="space-y-2 text-sm font-medium text-slate-700">
                              Brand
                              <input name="brand" defaultValue={product.brand ?? ""} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                            </label>
                            <label className="space-y-2 text-sm font-medium text-slate-700">
                              SKU
                              <input name="sku" defaultValue={product.sku ?? ""} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                            </label>
                            <label className="space-y-2 text-sm font-medium text-slate-700">
                              Price (ZAR)
                              <input name="price" type="number" min="0" step="0.01" defaultValue={(product.price_cents / 100).toFixed(2)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                            </label>
                            <label className="space-y-2 text-sm font-medium text-slate-700">
                              Compare at price (ZAR)
                              <input name="compare_at_price" type="number" min="0" step="0.01" defaultValue={product.compare_at_price_cents ? (product.compare_at_price_cents / 100).toFixed(2) : ""} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                            </label>
                            <label className="space-y-2 text-sm font-medium text-slate-700">
                              Stock quantity
                              <input name="stock_quantity" type="number" min="0" defaultValue={product.stock_quantity} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                            </label>
                            <label className="space-y-2 text-sm font-medium text-slate-700">
                              Category
                              <select name="category_id" defaultValue={product.category_id ?? ""} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                                <option value="">Uncategorised</option>
                                {categories.map((category) => (
                                  <option key={category.id} value={category.id}>{category.name}</option>
                                ))}
                              </select>
                            </label>
                            <label className="md:col-span-2 space-y-2 text-sm font-medium text-slate-700">
                              Description
                              <textarea name="description" rows={2} defaultValue={product.description ?? ""} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                            </label>
                            <label className="space-y-2 text-sm font-medium text-slate-700">
                              Tags
                              <input name="tags" defaultValue={tags} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                            </label>
                            <label className="space-y-2 text-sm font-medium text-slate-700">
                              Replace image URL
                              <input name="image_url" type="url" placeholder="https://..." className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                            </label>
                            <label className="md:col-span-2 space-y-2 text-sm font-medium text-slate-700">
                              Upload replacement image
                              <input name="image" type="file" accept="image/*" className="w-full rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm" />
                            </label>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
                            <label className="inline-flex items-center gap-2">
                              <input name="is_active" type="checkbox" defaultChecked={product.is_active} className="h-4 w-4 rounded border-slate-300" />
                              Active
                            </label>
                            <label className="inline-flex items-center gap-2">
                              <input name="is_featured" type="checkbox" defaultChecked={product.is_featured} className="h-4 w-4 rounded border-slate-300" />
                              Featured
                            </label>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <button type="submit" className="inline-flex rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                              Save changes
                            </button>
                          </div>
                        </div>
                      </form>

                      <form action={deleteProductAction} className="mt-3">
                        <input type="hidden" name="id" value={product.id} />
                        <button type="submit" className="inline-flex rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50">
                          Delete product
                        </button>
                      </form>
                    </div>
                  </details>
                );
              })
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                No products matched this filter.
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-600">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Link
                href={buildAdminHref(currentFilter, Math.max(1, currentPage - 1))}
                className={`rounded-full border px-4 py-2 text-sm font-medium ${currentPage === 1 ? "pointer-events-none border-slate-200 text-slate-300" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
              >
                Previous
              </Link>
              <Link
                href={buildAdminHref(currentFilter, Math.min(totalPages, currentPage + 1))}
                className={`rounded-full border px-4 py-2 text-sm font-medium ${currentPage === totalPages ? "pointer-events-none border-slate-200 text-slate-300" : "border-slate-200 text-slate-700 hover:bg-slate-50"}`}
              >
                Next
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <details open className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <summary className="cursor-pointer list-none text-2xl font-black tracking-tight text-slate-950">
              Quick add product
            </summary>
            <p className="mt-2 text-sm text-slate-600">
              Keep this fast: add a name, a price, and a working image. Everything else can be refined later.
            </p>
            <form action={createProductAction} className="mt-6 grid gap-4">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Product name
                <input name="name" required className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Brand
                <input name="brand" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Category
                <select name="category_id" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                  <option value="">Uncategorised</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Price (ZAR)
                  <input name="price" type="number" min="0" step="0.01" defaultValue="999.00" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700">
                  Stock quantity
                  <input name="stock_quantity" type="number" min="0" defaultValue="10" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                </label>
              </div>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Image URL
                <input name="image_url" type="url" placeholder="https://..." className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Upload image
                <input name="image" type="file" accept="image/*" className="w-full rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm" />
              </label>
              <div className="flex flex-wrap gap-4 text-sm text-slate-700">
                <label className="inline-flex items-center gap-2">
                  <input name="is_active" type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300" />
                  Active product
                </label>
                <label className="inline-flex items-center gap-2">
                  <input name="is_featured" type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                  Feature on storefront
                </label>
              </div>
              <button type="submit" className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Create product
              </button>
            </form>
          </details>

          <details className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <summary className="cursor-pointer list-none text-2xl font-black tracking-tight text-slate-950">
              Categories management
            </summary>
            <p className="mt-2 text-sm text-slate-600">
              Keep categories tidy so products can be discovered quickly.
            </p>

            <form action={createCategoryAction} className="mt-6 grid gap-4">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Category name
                <input name="name" required className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Slug
                <input name="slug" placeholder="auto-generated if left blank" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Description
                <textarea name="description" rows={2} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Parent category
                <select name="parent_id" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                  <option value="">Top level</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Image URL
                <input name="image_url" type="url" placeholder="https://..." className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Upload image
                <input name="image" type="file" accept="image/*" className="w-full rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm" />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Sort order
                <input name="sort_order" type="number" defaultValue="0" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              </label>
              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <input name="is_active" type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300" />
                Active category
              </label>
              <button type="submit" className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Create category
              </button>
            </form>

            <div className="mt-8 space-y-3">
              {categories.map((category) => (
                <details key={category.id} className="rounded-3xl border border-slate-200 p-4">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-950">{category.name}</p>
                        <p className="text-sm text-slate-500">{category.slug}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {categoryCounts.get(category.id) ?? 0} products
                      </span>
                    </div>
                  </summary>
                  <form action={updateCategoryAction} className="mt-4 space-y-4">
                    <input type="hidden" name="id" value={category.id} />
                    <input type="hidden" name="existing_image_url" value={category.image_url ?? ""} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <input name="name" defaultValue={category.name} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                      <input name="slug" defaultValue={category.slug} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                      <input name="image_url" defaultValue={category.image_url ?? ""} placeholder="https://..." className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                      <select name="parent_id" defaultValue={category.parent_id ?? ""} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                        <option value="">Top level</option>
                        {categories.filter((item) => item.id !== category.id).map((item) => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </select>
                    </div>
                    <textarea name="description" rows={2} defaultValue={category.description ?? ""} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
                      <input name="sort_order" type="number" defaultValue={category.sort_order} className="w-24 rounded-2xl border border-slate-300 px-3 py-2 text-sm" />
                      <label className="inline-flex items-center gap-2">
                        <input name="is_active" type="checkbox" defaultChecked={category.is_active} className="h-4 w-4 rounded border-slate-300" />
                        Active
                      </label>
                    </div>
                    <input name="image" type="file" accept="image/*" className="w-full rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm" />
                    <div className="flex flex-wrap gap-3">
                      <button type="submit" className="inline-flex rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                        Save category
                      </button>
                    </div>
                  </form>
                  <form action={deleteCategoryAction} className="mt-3">
                    <input type="hidden" name="id" value={category.id} />
                    <button type="submit" className="inline-flex rounded-full border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50">
                      Delete category
                    </button>
                  </form>
                </details>
              ))}
            </div>
          </details>

          <div className="rounded-4xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-black tracking-tight text-slate-950">User roles</h2>
            <p className="mt-2 text-sm text-slate-600">
              Create Clerk-backed staff and customer accounts, then manage synced roles from one place. Showing the latest {users.length} of {totalUsers} synced users.
            </p>

            {canManageUsers ? (
              <form action={createManagedUserAction} className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Add a staff or customer user</p>
                  <p className="mt-1 text-sm text-slate-600">
                    This creates the sign-in account in Clerk and syncs the profile into Supabase immediately.
                  </p>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    First name
                    <input name="first_name" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Last name
                    <input name="last_name" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                    Email address
                    <input name="email" type="email" required className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Phone number
                    <input name="phone" type="tel" placeholder="+2782..." className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700">
                    Role
                    <select name="role" defaultValue="customer" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm">
                      <option value="customer">Customer</option>
                      <option value="staff">Staff</option>
                    </select>
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
                    Temporary password
                    <input
                      name="temporary_password"
                      type="password"
                      minLength={8}
                      required
                      placeholder="At least 8 characters"
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                    />
                  </label>
                </div>

                <label className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input name="marketing_opt_in" type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                  Marketing opt-in enabled
                </label>

                <div className="mt-4">
                  <button type="submit" className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                    Create user account
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Only full admin users can add new staff or customer accounts.
              </div>
            )}

            <div className="mt-6 space-y-3">
              {users.map((user) => {
                const roleList = getUserRoles(user);
                const displayName = [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email;

                return (
                  <form key={user.id} action={updateUserRolesAction} className="rounded-3xl border border-slate-200 p-4">
                    <input type="hidden" name="id" value={user.id} />
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <p className="font-semibold text-slate-950">{displayName}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {availableRoles.map((role) => (
                          <label key={role} className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-700">
                            <input
                              name="roles"
                              type="checkbox"
                              value={role}
                              defaultChecked={roleList.includes(role)}
                              disabled={!canManageUsers}
                              className="h-4 w-4 rounded border-slate-300"
                            />
                            {role}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        Primary role: {user.role ?? "customer"}
                      </span>
                      <button
                        type="submit"
                        disabled={!canManageUsers}
                        className="inline-flex rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {canManageUsers ? "Update roles" : "Admin only"}
                      </button>
                    </div>
                  </form>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
