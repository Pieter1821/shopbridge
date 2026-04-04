@AGENTS.md



# ShopBridge — Full E-Commerce Implementation Plan

## Context
Build **ShopBridge** from scratch: a South African e-commerce site inspired by Takealot (process flow) and Kickgame (product focus). Stack: Next.js App Router + Supabase + Clerk + Tailwind + shadcn/ui. Prices in ZAR stored as integer cents. Includes a CRM-like admin panel so the owner can manage their own products without touching code.

---

## Phase 0 — External Services Setup (Before Writing Code)

### 0.1 Supabase
1. supabase.com → New project → name: `shopbridge`, region: `eu-west-2` (London — closest to ZA)
2. Settings → API → copy: `Project URL`, `anon key`, `service_role key`
3. After schema is created: Database → Replication → add `products` table to `supabase_realtime` publication

### 0.2 Clerk
1. clerk.com → Create application → name: `ShopBridge`, enable Email/Password + Google
2. Dashboard → JWT Templates → New → Supabase template (name: `supabase`)
   - Claims: `{ "sub": "{{user.id}}", "role": "authenticated" }`
3. Webhooks → Add endpoint → URL: `https://your-domain/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted` → copy Signing Secret
4. Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`

---

## Phase 1 — Project Scaffold

```bash
pnpm create next-app@latest shopbridge --typescript --tailwind --app --import-alias "@/*"
cd shopbridge
```

### 1.1 Install All Dependencies

```bash
# Auth
pnpm add @clerk/nextjs

# Supabase
pnpm add @supabase/supabase-js @supabase/ssr

# State management
pnpm add zustand

# Forms & validation
pnpm add react-hook-form @hookform/resolvers zod

# Utilities
pnpm add lucide-react clsx tailwind-merge svix

# shadcn/ui init
pnpm dlx shadcn@latest init

# shadcn/ui components (run as one batch)
pnpm dlx shadcn@latest add button input label badge card separator skeleton \
  navigation-menu breadcrumb sheet dropdown-menu accordion \
  command popover carousel tabs dialog hover-card progress table \
  form select checkbox radio-group switch textarea toggle-group \
  slider pagination alert alert-dialog sonner avatar tooltip
```

### 1.2 Environment Variables (`.env.local`)

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # server-only, never expose to browser
```

---

## Phase 2 — Database Schema (Run in Supabase SQL Editor)

```sql
-- CATEGORIES
CREATE TABLE categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  description text,
  image_url   text,
  parent_id   uuid REFERENCES categories(id),
  sort_order  int DEFAULT 0,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- PRODUCTS
CREATE TABLE products (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id            uuid REFERENCES categories(id),
  name                   text NOT NULL,
  slug                   text NOT NULL UNIQUE,
  description            text,
  brand                  text,
  price_cents            int NOT NULL CHECK (price_cents >= 0),
  compare_at_price_cents int,
  sku                    text UNIQUE,
  stock_quantity         int NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  images                 text[] DEFAULT '{}',
  tags                   text[] DEFAULT '{}',
  is_active              boolean DEFAULT true,
  is_featured            boolean DEFAULT false,
  metadata               jsonb DEFAULT '{}',
  fts tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(brand, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) STORED,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
CREATE INDEX products_fts_idx ON products USING GIN(fts);
CREATE INDEX products_category_idx ON products(category_id);
CREATE INDEX products_price_idx ON products(price_cents);

-- PRODUCT VARIANTS (sizes, colors)
CREATE TABLE product_variants (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name           text NOT NULL,
  sku            text UNIQUE,
  price_cents    int,
  stock_quantity int NOT NULL DEFAULT 0,
  options        jsonb DEFAULT '{}',  -- {"size": "UK 9", "color": "Black"}
  is_active      boolean DEFAULT true,
  created_at     timestamptz DEFAULT now()
);

-- USERS (synced from Clerk via webhook)
CREATE TABLE users (
  id          text PRIMARY KEY,  -- Clerk user_id string
  email       text NOT NULL UNIQUE,
  first_name  text,
  last_name   text,
  phone       text,
  avatar_url  text,
  role        text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- ADDRESSES
CREATE TABLE addresses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label       text,
  first_name  text NOT NULL,
  last_name   text NOT NULL,
  line1       text NOT NULL,
  line2       text,
  city        text NOT NULL,
  province    text NOT NULL,
  postal_code text NOT NULL,
  country     text NOT NULL DEFAULT 'ZA',
  phone       text,
  is_default  boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- CARTS
CREATE TABLE carts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text REFERENCES users(id) ON DELETE SET NULL,
  session_id  text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
CREATE TABLE cart_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id          uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id       uuid NOT NULL REFERENCES products(id),
  variant_id       uuid REFERENCES product_variants(id),
  quantity         int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_cents int NOT NULL,
  created_at       timestamptz DEFAULT now(),
  UNIQUE(cart_id, product_id, variant_id)
);

-- WISHLISTS
CREATE TABLE wishlists (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  added_at   timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- ORDERS
CREATE TABLE orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           text REFERENCES users(id),
  order_number      text NOT NULL UNIQUE,
  status            text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
  subtotal_cents    int NOT NULL,
  shipping_cents    int NOT NULL DEFAULT 0,
  tax_cents         int NOT NULL DEFAULT 0,
  total_cents       int NOT NULL,
  currency          text NOT NULL DEFAULT 'ZAR',
  shipping_address  jsonb NOT NULL,
  payment_status    text DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid','paid','partially_refunded','refunded')),
  payment_provider  text,
  payment_reference text,
  notes             text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);
CREATE INDEX orders_user_idx ON orders(user_id);
CREATE INDEX orders_status_idx ON orders(status);

CREATE TABLE order_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id       uuid REFERENCES products(id),
  variant_id       uuid REFERENCES product_variants(id),
  product_name     text NOT NULL,
  variant_name     text,
  quantity         int NOT NULL,
  unit_price_cents int NOT NULL,
  total_cents      int NOT NULL,
  created_at       timestamptz DEFAULT now()
);

-- RLS SETUP
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

-- Helper function: get Clerk user_id from JWT
CREATE OR REPLACE FUNCTION auth.clerk_user_id()
RETURNS text LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb->>'sub', '')
$$;

-- RLS Policies
CREATE POLICY "Users see own orders" ON orders FOR SELECT USING (user_id = auth.clerk_user_id());
CREATE POLICY "Users insert own orders" ON orders FOR INSERT WITH CHECK (user_id = auth.clerk_user_id());
CREATE POLICY "Users manage own addresses" ON addresses FOR ALL USING (user_id = auth.clerk_user_id());
CREATE POLICY "Users manage own wishlists" ON wishlists FOR ALL USING (user_id = auth.clerk_user_id());
CREATE POLICY "Products are public" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Categories are public" ON categories FOR SELECT USING (is_active = true);

-- Enable Realtime on products table
ALTER PUBLICATION supabase_realtime ADD TABLE products;
```

---

## Phase 3 — Project File Structure

```
shopbridge/
├── app/
│   ├── layout.tsx                          ← ClerkProvider root
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (shop)/
│   │   ├── layout.tsx                      ← NavBar + Footer
│   │   ├── page.tsx                        ← Homepage
│   │   ├── products/
│   │   │   ├── page.tsx                    ← All products listing
│   │   │   └── [slug]/page.tsx             ← Product detail
│   │   ├── categories/[slug]/page.tsx      ← Category listing
│   │   ├── search/page.tsx                 ← Search results
│   │   ├── cart/page.tsx
│   │   ├── checkout/
│   │   │   ├── page.tsx                    ← Multi-step checkout
│   │   │   └── success/page.tsx
│   ├── (account)/
│   │   ├── layout.tsx                      ← Account sidebar
│   │   ├── account/page.tsx
│   │   ├── orders/page.tsx
│   │   ├── orders/[id]/page.tsx
│   │   ├── wishlist/page.tsx
│   │   └── addresses/page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx                      ← Admin sidebar (role-gated)
│   │   ├── admin/page.tsx                  ← Dashboard overview
│   │   ├── admin/products/page.tsx         ← Product list + search
│   │   ├── admin/products/new/page.tsx     ← Add product form
│   │   ├── admin/products/[id]/page.tsx    ← Edit product form
│   │   ├── admin/categories/page.tsx
│   │   └── admin/orders/page.tsx           ← Order management
│   └── api/
│       ├── webhooks/clerk/route.ts         ← User sync
│       ├── cart/route.ts
│       └── checkout/route.ts
├── components/
│   ├── ui/                                 ← shadcn auto-generated
│   ├── layout/
│   │   ├── NavBar.tsx
│   │   ├── Footer.tsx
│   │   └── MegaMenu.tsx
│   ├── products/
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── ProductFilters.tsx
│   │   └── ImageGallery.tsx
│   ├── search/
│   │   └── SearchCommand.tsx
│   ├── cart/
│   │   ├── CartDrawer.tsx
│   │   └── CartSummary.tsx
│   ├── checkout/
│   │   ├── CheckoutSteps.tsx
│   │   ├── AddressForm.tsx
│   │   └── OrderReview.tsx
│   └── shared/
│       ├── StockBadge.tsx                  ← Realtime-connected
│       └── PriceDisplay.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                       ← Browser client
│   │   ├── server.ts                       ← RSC/route handler client
│   │   └── admin.ts                        ← Service role (server only)
│   └── utils.ts                            ← formatZAR, cn, generateOrderNumber
├── hooks/
│   ├── use-realtime-stock.ts
│   └── use-search.ts
├── store/
│   └── cart-store.ts                       ← Zustand cart store
├── types/
│   └── database.ts                         ← Supabase generated types
└── middleware.ts                            ← Clerk route protection
```

---

## Phase 4 — Key Implementation Patterns

### 4.1 Middleware (`middleware.ts`)
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/', '/products(.*)', '/categories(.*)', '/search(.*)',
  '/sign-in(.*)', '/sign-up(.*)', '/api/webhooks(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) await auth.protect()
})

export const config = {
  matcher: ['/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico)).*)', '/(api|trpc)(.*)'],
}
```

### 4.2 Supabase Clients

**`lib/supabase/client.ts`** — browser:
```typescript
import { createBrowserClient } from '@supabase/ssr'
export const createClient = () => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**`lib/supabase/server.ts`** — RSC (with Clerk JWT):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { auth } from '@clerk/nextjs/server'

export async function createClient() {
  const { getToken } = await auth()
  const token = await getToken({ template: 'supabase' })
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  )
}
```

**`lib/supabase/admin.ts`** — service role (bypasses RLS):
```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
export const createClient = () => createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

### 4.3 Zustand Cart Store (`store/cart-store.ts`)
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  productId: string
  variantId?: string
  name: string
  image: string
  priceCents: number
  quantity: number
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void
  clearCart: () => void
  totalCents: () => number
  itemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => {
        const existing = state.items.find(i => i.productId === item.productId && i.variantId === item.variantId)
        if (existing) {
          return { items: state.items.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + item.quantity } : i) }
        }
        return { items: [...state.items, item] }
      }),
      removeItem: (productId, variantId) => set((state) => ({
        items: state.items.filter(i => !(i.productId === productId && i.variantId === variantId))
      })),
      updateQuantity: (productId, quantity, variantId) => set((state) => ({
        items: state.items.map(i => i.productId === productId && i.variantId === variantId ? { ...i, quantity } : i)
      })),
      clearCart: () => set({ items: [] }),
      totalCents: () => get().items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'shopbridge-cart' }
  )
)
```

### 4.4 Real-time Stock Hook (`hooks/use-realtime-stock.ts`)
```typescript
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeStock(productId: string, initialStock: number) {
  const [stock, setStock] = useState(initialStock)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`stock-${productId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'products',
        filter: `id=eq.${productId}`,
      }, (payload) => setStock(payload.new.stock_quantity))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [productId])

  return stock
}
```

### 4.5 Zod Schemas for Forms
```typescript
// Checkout address
const addressSchema = z.object({
  firstName: z.string().min(2, 'Required'),
  lastName: z.string().min(2, 'Required'),
  phone: z.string().regex(/^0[6-8][0-9]{8}$/, 'Valid SA mobile required'),
  line1: z.string().min(5, 'Required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'Required'),
  province: z.enum(['GP','WC','KZN','EC','FS','LP','MP','NC','NW']),
  postalCode: z.string().regex(/^\d{4}$/, '4-digit postal code'),
})

// Admin product form
const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  brand: z.string().optional(),
  categoryId: z.string().uuid(),
  priceCents: z.number().int().min(1),
  compareAtPriceCents: z.number().int().optional(),
  sku: z.string().optional(),
  stockQuantity: z.number().int().min(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
})
```

### 4.6 ZAR Price Formatting (`lib/utils.ts`)
```typescript
export const formatZAR = (cents: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0 })
    .format(cents / 100)
// Output: "R 1,299"

export const generateOrderNumber = () =>
  `SB-${new Date().getFullYear()}${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`
```

### 4.7 Full-Text Search Query
```typescript
// In search/page.tsx (Server Component)
const { data: products } = await supabase
  .from('products')
  .select('id, name, slug, price_cents, images, brand, stock_quantity')
  .textSearch('fts', query, { type: 'websearch', config: 'english' })
  .eq('is_active', true)
  .order('created_at', { ascending: false })
  .limit(24)
```

### 4.8 Clerk Webhook (`app/api/webhooks/clerk/route.ts`)
```typescript
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const payload = await req.text()
  const heads = Object.fromEntries((await headers()).entries())
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
  const event = wh.verify(payload, heads) as any
  const supabase = createClient()

  if (event.type === 'user.created' || event.type === 'user.updated') {
    await supabase.from('users').upsert({
      id: event.data.id,
      email: event.data.email_addresses[0]?.email_address,
      first_name: event.data.first_name,
      last_name: event.data.last_name,
      avatar_url: event.data.image_url,
    })
  }
  if (event.type === 'user.deleted') {
    await supabase.from('users').delete().eq('id', event.data.id)
  }
  return new Response('OK', { status: 200 })
}
```

---

## Phase 5 — CRM Admin Panel

The `(admin)` route group is role-gated: only users with `role = 'admin'` in the `users` table can access.

### Admin Pages
| Route | Feature |
|---|---|
| `/admin` | Dashboard: sales summary, recent orders, low-stock alerts |
| `/admin/products` | Product list with search, filter, bulk actions |
| `/admin/products/new` | Add product form (React Hook Form + Zod) |
| `/admin/products/[id]` | Edit product + manage variants + upload images |
| `/admin/categories` | Category management (nested) |
| `/admin/orders` | Order list, status updates, filter by status |
| `/admin/orders/[id]` | Order detail, update status, notes |

### Admin Product Form Fields
- Name, Slug (auto-generated from name), Brand
- Category (Select dropdown)
- Description (Textarea with markdown preview)
- Price (ZAR input → convert to cents on submit)
- Compare-at price (for sale display)
- SKU, Stock quantity
- Images (multi-upload to Supabase Storage)
- Tags (comma-separated input)
- Active toggle, Featured toggle
- Variants section: add/remove size/color variants with individual stock + price

### Admin Role Gate
```typescript
// app/(admin)/layout.tsx
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')
  const supabase = await createClient()
  const { data: user } = await supabase.from('users').select('role').eq('id', userId).single()
  if (user?.role !== 'admin') redirect('/')
  return <>{children}</>
}
```

---

## Phase 6 — UX Components Map

| Page | Key shadcn/ui Components |
|---|---|
| **NavBar** | `NavigationMenu`, `Sheet`, `Command`, `Popover`, `DropdownMenu`, `Avatar`, `Badge` |
| **Homepage** | `Carousel`, `Card`, `Badge`, `Skeleton` |
| **Product Listing** | `Accordion`, `Slider`, `Checkbox`, `RadioGroup`, `Select`, `Pagination`, `Sheet` |
| **Product Detail** | `Carousel`, `Tabs`, `ToggleGroup`, `Dialog`, `Badge`, `Progress`, `Table`, `Breadcrumb` |
| **Cart** | `Card`, `Button`, `Input`, `Separator`, `AlertDialog` |
| **Checkout** | `Form`, `Input`, `Select`, `RadioGroup`, `Card`, `Progress`, `Alert` |
| **Orders** | `Table`, `Badge`, `Card`, `Progress` |
| **Admin** | `Table`, `Form`, `Dialog`, `AlertDialog`, `Badge`, `Card`, `Tabs`, `Sonner` |

**StockBadge component:**
```tsx
export function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <Badge variant="destructive">Out of Stock</Badge>
  if (stock <= 5) return <Badge className="text-amber-600 border-amber-600" variant="outline">Only {stock} left</Badge>
  return <Badge className="text-green-600 border-green-600" variant="outline">In Stock</Badge>
}
```

---

## Phase 7 — Build Order

1. Scaffold + install deps (Phase 1)
2. Run database schema SQL in Supabase (Phase 2)
3. Configure Supabase Realtime + Storage bucket `product-images`
4. Set up Clerk webhook endpoint
5. `middleware.ts` + root `layout.tsx` (ClerkProvider)
6. Supabase clients (client.ts, server.ts, admin.ts)
7. `lib/utils.ts` + `types/database.ts` (generate with `supabase gen types`)
8. Zustand cart store (`store/cart-store.ts`)
9. Shared components: NavBar, Footer, PriceDisplay, StockBadge
10. Homepage (static shell → wire up featured products)
11. Product listing page + filters + pagination
12. Product detail page + image gallery + variants + real-time stock
13. Search (SearchCommand autocomplete + results page)
14. Cart (drawer + cart page + server sync)
15. Checkout multi-step + order creation
16. Order confirmation + order tracking page
17. Account pages (orders, addresses, wishlist, profile)
18. **Admin CRM**: product CRUD + category management + order management
19. Seed data: 5 categories + 50 products + sample orders
20. Supabase RLS policy testing

---

## Verification Checklist

- [ ] `pnpm dev` — loads without errors
- [ ] Sign up → user appears in Supabase `users` table
- [ ] Browse products → loads from Supabase
- [ ] Search "sneakers" → full-text results appear
- [ ] Add to cart → persists in Zustand + localStorage
- [ ] Real-time: update stock in Supabase → badge updates without refresh
- [ ] Checkout → order created in `orders` table
- [ ] Account → orders page shows placed order
- [ ] Admin: add new product → appears on storefront
- [ ] Admin: update order status → reflects in account orders page
- [ ] RLS: user can only see their own orders (test with two accounts)

---
dont use mock data ever !!!!!!!!!!!!!!!!!!!important 