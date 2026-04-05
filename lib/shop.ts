import { cache } from "react";

import { createReadonlyClient } from "@/lib/supabase/server";

export type StorefrontCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number | null;
};

export type StorefrontProduct = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  description: string | null;
  price_cents: number;
  compare_at_price_cents: number | null;
  stock_quantity: number;
  low_stock_threshold: number | null;
  images: string[] | null;
  tags: string[] | null;
  is_featured: boolean | null;
  category: {
    name: string;
    slug: string;
  } | null;
};

const productSelect = `
  id,
  slug,
  name,
  brand,
  description,
  price_cents,
  compare_at_price_cents,
  stock_quantity,
  low_stock_threshold,
  images,
  tags,
  is_featured,
  category:categories(name, slug)
`;

type RawStorefrontProduct = Omit<StorefrontProduct, "category"> & {
  category:
    | StorefrontProduct["category"]
    | NonNullable<StorefrontProduct["category"]>[]
    | null;
};

function normalizeStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // fall through to Postgres array parsing
    }

    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      return trimmed
        .slice(1, -1)
        .split(",")
        .map((item) => item.replace(/^"|"$/g, "").trim())
        .filter(Boolean);
    }

    return [trimmed];
  }

  return [];
}

function normalizeProduct(row: RawStorefrontProduct): StorefrontProduct {
  return {
    ...row,
    images: normalizeStringArray(row.images),
    tags: normalizeStringArray(row.tags),
    category: Array.isArray(row.category) ? row.category[0] ?? null : row.category ?? null,
  };
}

function normalizeProducts(rows: RawStorefrontProduct[] | null | undefined) {
  return (rows ?? []).map((row) => normalizeProduct(row));
}

function filterMerchandisedProducts(products: StorefrontProduct[]) {
  return products.filter((product) => (product.images ?? []).length > 0);
}

function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY),
  );
}

async function getSupabase() {
  if (!hasSupabaseConfig()) {
    return null;
  }

  try {
    return createReadonlyClient();
  } catch (error) {
    console.error("Unable to create Supabase client", error);
    return null;
  }
}

export const getCategories = cache(async (): Promise<StorefrontCategory[]> => {
  const supabase = await getSupabase();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load categories", error.message);
    return [];
  }

  return data ?? [];
});

export const getFeaturedProducts = cache(async (): Promise<StorefrontProduct[]> => {
  const supabase = await getSupabase();

  if (!supabase) {
    return [];
  }

  const featuredResult = await supabase
    .from("products")
    .select(productSelect)
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (!featuredResult.error && featuredResult.data?.length) {
    return filterMerchandisedProducts(normalizeProducts(featuredResult.data as RawStorefrontProduct[]));
  }

  const fallbackResult = await supabase
    .from("products")
    .select(productSelect)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (fallbackResult.error) {
    console.error("Failed to load featured products", fallbackResult.error.message);
    return [];
  }

  return filterMerchandisedProducts(normalizeProducts(fallbackResult.data as RawStorefrontProduct[] | null));
});

export async function getAllProducts(): Promise<StorefrontProduct[]> {
  const supabase = await getSupabase();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load products", error.message);
    return [];
  }

  return filterMerchandisedProducts(normalizeProducts(data as RawStorefrontProduct[] | null));
}

export async function getProductBySlug(slug: string): Promise<StorefrontProduct | null> {
  const supabase = await getSupabase();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error(`Failed to load product ${slug}`, error.message);
    return null;
  }

  if (!data) {
    return null;
  }

  const product = normalizeProduct(data as RawStorefrontProduct);
  return (product.images ?? []).length > 0 ? product : null;
}

export async function searchStoreProducts(query: string, limit?: number): Promise<StorefrontProduct[]> {
  const trimmed = query.trim();
  const normalizedLimit =
    typeof limit === "number" ? Math.min(Math.max(Math.trunc(limit), 1), 24) : undefined;

  if (!trimmed) {
    const products = await getAllProducts();
    return normalizedLimit ? products.slice(0, normalizedLimit) : products;
  }

  const supabase = await getSupabase();

  if (!supabase) {
    return [];
  }

  const safeQuery = trimmed.replace(/[%,'()]/g, " ").replace(/\s+/g, " ").trim();
  const tokens = Array.from(new Set(safeQuery.split(" ").filter(Boolean))).slice(0, 5);

  let textSearchQuery = supabase
    .from("products")
    .select(productSelect)
    .eq("is_active", true)
    .textSearch("fts", safeQuery, { type: "websearch", config: "english" })
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (normalizedLimit) {
    textSearchQuery = textSearchQuery.limit(normalizedLimit);
  }

  const { data: textSearchData, error: textSearchError } = await textSearchQuery;
  const textSearchResults = filterMerchandisedProducts(
    normalizeProducts(textSearchData as RawStorefrontProduct[] | null),
  );

  if (!textSearchError && textSearchResults.length > 0) {
    return textSearchResults;
  }

  if (!tokens.length) {
    return [];
  }

  const orFilters = tokens.flatMap((token) => [
    `name.ilike.%${token}%`,
    `brand.ilike.%${token}%`,
    `description.ilike.%${token}%`,
    `slug.ilike.%${token}%`,
  ]);

  let fallbackQuery = supabase
    .from("products")
    .select(productSelect)
    .eq("is_active", true)
    .or(orFilters.join(","))
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (normalizedLimit) {
    fallbackQuery = fallbackQuery.limit(normalizedLimit);
  }

  const { data, error } = await fallbackQuery;

  if (error) {
    console.error("Failed to search products", error.message);
    return [];
  }

  return filterMerchandisedProducts(normalizeProducts(data as RawStorefrontProduct[] | null));
}
