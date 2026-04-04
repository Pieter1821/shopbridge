-- ShopBridge initial ecommerce schema
-- Prices are stored as integer cents (ZAR)

create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;

DO $$
BEGIN
  CREATE TYPE public.user_role AS ENUM ('customer', 'admin', 'staff');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.cart_status AS ENUM ('active', 'converted', 'abandoned');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.order_status AS ENUM (
    'pending',
    'confirmed',
    'processing',
    'packed',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.payment_status AS ENUM (
    'unpaid',
    'pending',
    'paid',
    'failed',
    'partially_refunded',
    'refunded'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.fulfillment_status AS ENUM (
    'unfulfilled',
    'partial',
    'fulfilled',
    'returned'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.inventory_movement_type AS ENUM (
    'restock',
    'sale',
    'return',
    'adjustment'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.update_product_fts()
returns trigger
language plpgsql
as $$
begin
  new.fts :=
    setweight(to_tsvector('english', coalesce(new.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.brand, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(new.tags, ' '), '')), 'B');

  return new;
end;
$$;

create or replace function public.request_user_id()
returns text
language sql
stable
as $$
  select nullif((current_setting('request.jwt.claims', true)::jsonb ->> 'sub'), '');
$$;

create sequence if not exists public.order_number_seq start with 1000;

create or replace function public.generate_order_number()
returns text
language plpgsql
as $$
declare
  next_num bigint;
begin
  next_num := nextval('public.order_number_seq');
  return 'SB-' || to_char(now(), 'YYYY') || '-' || lpad(next_num::text, 6, '0');
end;
$$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  parent_id uuid references public.categories(id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  brand text,
  sku text unique,
  price_cents integer not null check (price_cents >= 0),
  compare_at_price_cents integer check (
    compare_at_price_cents is null or compare_at_price_cents >= price_cents
  ),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  images text[] not null default '{}',
  tags text[] not null default '{}',
  is_active boolean not null default true,
  is_featured boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  attributes jsonb not null default '{}'::jsonb,
  fts tsvector,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  sku text unique,
  barcode text,
  price_cents integer check (price_cents is null or price_cents >= 0),
  compare_at_price_cents integer check (
    compare_at_price_cents is null or price_cents is null or compare_at_price_cents >= price_cents
  ),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  options jsonb not null default '{}'::jsonb,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(product_id, name)
);

create table if not exists public.users (
  id text primary key,
  email citext not null unique,
  first_name text,
  last_name text,
  phone text,
  avatar_url text,
  role public.user_role not null default 'customer',
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = public.request_user_id()
      and role in ('admin', 'staff')
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (
    id,
    email,
    first_name,
    last_name,
    avatar_url
  )
  values (
    new.id::text,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    first_name = coalesce(excluded.first_name, public.users.first_name),
    last_name = coalesce(excluded.last_name, public.users.last_name),
    avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  label text,
  first_name text not null,
  last_name text not null,
  company text,
  phone text,
  line1 text not null,
  line2 text,
  suburb text,
  city text not null,
  province text not null,
  postal_code text not null,
  country text not null default 'ZA',
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  unique(user_id, product_id)
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id text references public.users(id) on delete set null,
  session_id text,
  status public.cart_status not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  check (user_id is not null or session_id is not null)
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity integer not null default 1 check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id text references public.users(id) on delete set null,
  order_number text not null unique default public.generate_order_number(),
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  fulfillment_status public.fulfillment_status not null default 'unfulfilled',
  subtotal_cents integer not null check (subtotal_cents >= 0),
  discount_cents integer not null default 0 check (discount_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  tax_cents integer not null default 0 check (tax_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  currency text not null default 'ZAR',
  customer_email citext not null,
  customer_phone text,
  shipping_method text,
  payment_provider text,
  payment_reference text,
  shipping_address jsonb not null,
  billing_address jsonb,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  sku text,
  product_name text not null,
  variant_name text,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  total_cents integer not null check (total_cents >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  reference text,
  amount_cents integer not null check (amount_cents >= 0),
  status public.payment_status not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.order_status_history (
  id bigserial primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  note text,
  changed_by text references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  is_approved boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(product_id, user_id)
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  movement_type public.inventory_movement_type not null,
  quantity_delta integer not null,
  reason text,
  created_by text references public.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists categories_parent_idx on public.categories(parent_id);
create index if not exists categories_active_sort_idx on public.categories(is_active, sort_order);

create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_price_idx on public.products(price_cents);
create index if not exists products_featured_idx on public.products(is_featured) where is_active = true;
create index if not exists products_fts_idx on public.products using gin(fts);
create index if not exists products_tags_idx on public.products using gin(tags);
create index if not exists products_name_trgm_idx on public.products using gin(name gin_trgm_ops);

create index if not exists product_variants_product_idx on public.product_variants(product_id);
create index if not exists addresses_user_idx on public.addresses(user_id);
create index if not exists wishlists_user_idx on public.wishlists(user_id);
create index if not exists carts_user_idx on public.carts(user_id);
create index if not exists carts_session_idx on public.carts(session_id);
create unique index if not exists carts_active_user_idx on public.carts(user_id)
  where status = 'active' and user_id is not null;
create unique index if not exists carts_active_session_idx on public.carts(session_id)
  where status = 'active' and session_id is not null;
create unique index if not exists cart_items_line_idx on public.cart_items (
  cart_id,
  product_id,
  coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid)
);
create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status, payment_status, fulfillment_status);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists payments_order_idx on public.payments(order_id);
create index if not exists reviews_product_idx on public.product_reviews(product_id);
create index if not exists inventory_product_idx on public.inventory_movements(product_id, created_at desc);

drop trigger if exists trg_categories_updated_at on public.categories;
create trigger trg_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists trg_products_fts on public.products;
create trigger trg_products_fts
before insert or update of name, brand, description, tags on public.products
for each row execute function public.update_product_fts();

drop trigger if exists trg_product_variants_updated_at on public.product_variants;
create trigger trg_product_variants_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists trg_addresses_updated_at on public.addresses;
create trigger trg_addresses_updated_at
before update on public.addresses
for each row execute function public.set_updated_at();

drop trigger if exists trg_carts_updated_at on public.carts;
create trigger trg_carts_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

drop trigger if exists trg_cart_items_updated_at on public.cart_items;
create trigger trg_cart_items_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_product_reviews_updated_at on public.product_reviews;
create trigger trg_product_reviews_updated_at
before update on public.product_reviews
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.users enable row level security;
alter table public.addresses enable row level security;
alter table public.wishlists enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.order_status_history enable row level security;
alter table public.product_reviews enable row level security;
alter table public.inventory_movements enable row level security;

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories"
on public.categories
for select
using (is_active = true or public.is_admin());

drop policy if exists "Admins manage categories" on public.categories;
create policy "Admins manage categories"
on public.categories
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products
for select
using (is_active = true or public.is_admin());

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products"
on public.products
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active variants" on public.product_variants;
create policy "Public can read active variants"
on public.product_variants
for select
using (is_active = true or public.is_admin());

drop policy if exists "Admins manage variants" on public.product_variants;
create policy "Admins manage variants"
on public.product_variants
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can view own profile" on public.users;
create policy "Users can view own profile"
on public.users
for select
using (id = public.request_user_id() or public.is_admin());

drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile"
on public.users
for insert
with check (id = public.request_user_id() or public.is_admin());

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users
for update
using (id = public.request_user_id() or public.is_admin())
with check (id = public.request_user_id() or public.is_admin());

drop policy if exists "Users manage own addresses" on public.addresses;
create policy "Users manage own addresses"
on public.addresses
for all
using (user_id = public.request_user_id() or public.is_admin())
with check (user_id = public.request_user_id() or public.is_admin());

drop policy if exists "Users manage own wishlist" on public.wishlists;
create policy "Users manage own wishlist"
on public.wishlists
for all
using (user_id = public.request_user_id() or public.is_admin())
with check (user_id = public.request_user_id() or public.is_admin());

drop policy if exists "Users manage own carts" on public.carts;
create policy "Users manage own carts"
on public.carts
for all
using (user_id = public.request_user_id() or public.is_admin())
with check (
  user_id = public.request_user_id()
  or public.is_admin()
  or (public.request_user_id() is null and user_id is null)
);

drop policy if exists "Users manage own cart items" on public.cart_items;
create policy "Users manage own cart items"
on public.cart_items
for all
using (
  exists (
    select 1
    from public.carts c
    where c.id = cart_items.cart_id
      and (c.user_id = public.request_user_id() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.carts c
    where c.id = cart_items.cart_id
      and (
        c.user_id = public.request_user_id()
        or public.is_admin()
        or (public.request_user_id() is null and c.user_id is null)
      )
  )
);

drop policy if exists "Users view own orders" on public.orders;
create policy "Users view own orders"
on public.orders
for select
using (user_id = public.request_user_id() or public.is_admin());

drop policy if exists "Users create own orders" on public.orders;
create policy "Users create own orders"
on public.orders
for insert
with check (user_id = public.request_user_id() or public.is_admin());

drop policy if exists "Admins update orders" on public.orders;
create policy "Admins update orders"
on public.orders
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users view own order items" on public.order_items;
create policy "Users view own order items"
on public.order_items
for select
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
      and (o.user_id = public.request_user_id() or public.is_admin())
  )
);

drop policy if exists "Users view own payments" on public.payments;
create policy "Users view own payments"
on public.payments
for select
using (
  exists (
    select 1
    from public.orders o
    where o.id = payments.order_id
      and (o.user_id = public.request_user_id() or public.is_admin())
  )
);

drop policy if exists "Admins manage payments" on public.payments;
create policy "Admins manage payments"
on public.payments
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users view own order history" on public.order_status_history;
create policy "Users view own order history"
on public.order_status_history
for select
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_status_history.order_id
      and (o.user_id = public.request_user_id() or public.is_admin())
  )
);

drop policy if exists "Admins manage order history" on public.order_status_history;
create policy "Admins manage order history"
on public.order_status_history
for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can read approved reviews" on public.product_reviews;
create policy "Users can read approved reviews"
on public.product_reviews
for select
using (is_approved = true or public.is_admin() or user_id = public.request_user_id());

drop policy if exists "Users create own reviews" on public.product_reviews;
create policy "Users create own reviews"
on public.product_reviews
for insert
with check (user_id = public.request_user_id() or public.is_admin());

drop policy if exists "Users update own reviews" on public.product_reviews;
create policy "Users update own reviews"
on public.product_reviews
for update
using (user_id = public.request_user_id() or public.is_admin())
with check (user_id = public.request_user_id() or public.is_admin());

drop policy if exists "Admins manage inventory" on public.inventory_movements;
create policy "Admins manage inventory"
on public.inventory_movements
for all
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'products'
    ) then
      execute 'alter publication supabase_realtime add table public.products';
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'product_variants'
    ) then
      execute 'alter publication supabase_realtime add table public.product_variants';
    end if;
  end if;
end $$;
