-- =====================================================================
-- KAIRO — schema
-- Money is always integer paise (₹1 = 100 paise). Never floats.
-- =====================================================================

-- ---------- Types ----------
create type public.user_role      as enum ('customer', 'admin');
create type public.theme_name     as enum ('noir', 'street', 'formal', 'old-money', 'riding');
create type public.order_status   as enum ('pending_payment', 'placed', 'packed', 'shipped', 'delivered', 'cancelled');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refund_due', 'refunded');
create type public.review_status  as enum ('pending', 'approved', 'rejected');
create type public.coupon_kind    as enum ('percent', 'fixed');
create type public.pairing_kind   as enum ('look', 'another_way');

-- ---------- Shared trigger: updated_at ----------
create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- People ----------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (char_length(full_name) <= 120),
  phone       text check (phone ~ '^[6-9][0-9]{9}$'),
  role        public.user_role not null default 'customer',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

create table public.addresses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  name        text not null check (char_length(name) between 2 and 120),
  phone       text not null check (phone ~ '^[6-9][0-9]{9}$'),
  line1       text not null check (char_length(line1) between 3 and 200),
  line2       text check (char_length(line2) <= 200),
  city        text not null check (char_length(city) between 2 and 80),
  state       text not null check (char_length(state) between 2 and 80),
  pincode     text not null check (pincode ~ '^[1-9][0-9]{5}$'),
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);
create index addresses_user_idx on public.addresses (user_id);
-- at most one default address per user
create unique index addresses_one_default on public.addresses (user_id) where is_default;

-- ---------- Catalog ----------
create table public.collections (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null,
  tagline     text not null,
  theme       public.theme_name not null,
  position    int not null default 0,
  hero_image  text
);

create table public.drops (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name        text not null,
  description text not null default '',
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  hero_image  text,
  check (ends_at is null or ends_at > starts_at)
);

create table public.products (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name              text not null check (char_length(name) between 2 and 120),
  collection_id     uuid not null references public.collections (id) on delete restrict,
  description       text not null default '',
  fabric            text not null default '',
  fit               text not null default '',
  care              text not null default '',
  price_paise       int  not null check (price_paise > 0),
  compare_at_paise  int  check (compare_at_paise is null or compare_at_paise > price_paise),
  is_published      boolean not null default false,
  drop_id           uuid references public.drops (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  search            tsvector generated always as (
                      setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
                      setweight(to_tsvector('english', coalesce(fabric, '')), 'B') ||
                      setweight(to_tsvector('english', coalesce(description, '')), 'C')
                    ) stored
);
create index products_collection_idx on public.products (collection_id) where is_published;
create index products_search_idx on public.products using gin (search);
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  path        text not null,
  alt         text not null check (char_length(alt) between 3 and 200),
  position    int  not null default 0
);
create index product_images_product_idx on public.product_images (product_id, position);

create table public.variants (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products (id) on delete cascade,
  size        text not null check (char_length(size) between 1 and 8),
  colour      text not null check (char_length(colour) between 2 and 40),
  sku         text not null unique,
  stock       int  not null default 0 check (stock >= 0),
  position    int  not null default 0,
  unique (product_id, size, colour)
);
create index variants_product_idx on public.variants (product_id);

create table public.product_pairings (
  product_id         uuid not null references public.products (id) on delete cascade,
  paired_product_id  uuid not null references public.products (id) on delete cascade,
  kind               public.pairing_kind not null,
  position           int not null default 0,
  primary key (product_id, paired_product_id, kind),
  check (product_id <> paired_product_id)
);

create table public.wishlist_items (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  product_id  uuid not null references public.products (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, product_id)
);

-- ---------- Coupons ----------
create table public.coupons (
  id                  uuid primary key default gen_random_uuid(),
  code                text not null unique check (code ~ '^[A-Z0-9]{3,20}$'),
  kind                public.coupon_kind not null,
  value               int  not null check (value > 0),
  min_subtotal_paise  int  not null default 0 check (min_subtotal_paise >= 0),
  starts_at           timestamptz,
  ends_at             timestamptz,
  max_uses            int  check (max_uses is null or max_uses > 0),
  used_count          int  not null default 0 check (used_count >= 0),
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  check (kind <> 'percent' or value <= 90),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

-- ---------- Orders ----------
create table public.orders (
  id                   uuid primary key default gen_random_uuid(),
  number               text not null unique,
  user_id              uuid references public.profiles (id) on delete set null,
  email                text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  phone                text not null check (phone ~ '^[6-9][0-9]{9}$'),
  status               public.order_status   not null default 'pending_payment',
  payment_status       public.payment_status not null default 'pending',
  subtotal_paise       int not null check (subtotal_paise >= 0),
  discount_paise       int not null default 0 check (discount_paise >= 0),
  shipping_paise       int not null default 0 check (shipping_paise >= 0),
  total_paise          int not null check (total_paise > 0),
  coupon_code          text,
  razorpay_order_id    text unique,
  razorpay_payment_id  text unique,
  shipping_address     jsonb not null,
  paid_at              timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  check (discount_paise <= subtotal_paise),
  check (total_paise = subtotal_paise - discount_paise + shipping_paise)
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

create table public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders (id) on delete cascade,
  product_id        uuid references public.products (id) on delete set null,
  variant_id        uuid references public.variants (id) on delete set null,
  product_name      text not null,
  product_slug      text not null,
  size              text not null,
  colour            text not null,
  image_path        text,
  unit_price_paise  int not null check (unit_price_paise > 0),
  qty               int not null check (qty between 1 and 5)
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

create table public.order_events (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders (id) on delete cascade,
  status      public.order_status not null,
  note        text,
  created_at  timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, created_at);

-- ---------- Reviews ----------
create table public.reviews (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references public.products (id) on delete cascade,
  user_id      uuid references public.profiles (id) on delete set null,
  author_name  text not null check (char_length(author_name) between 2 and 60),
  rating       int  not null check (rating between 1 and 5),
  title        text not null check (char_length(title) between 2 and 120),
  body         text not null check (char_length(body) between 10 and 2000),
  photo_paths  text[] not null default '{}' check (cardinality(photo_paths) <= 4),
  is_sample    boolean not null default false,
  is_verified  boolean not null default false,
  status       public.review_status not null default 'pending',
  created_at   timestamptz not null default now(),
  check (not (is_sample and is_verified))
);
create index reviews_product_idx on public.reviews (product_id, created_at desc) where status = 'approved';

-- ---------- Inbound messages ----------
create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 120),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  phone       text check (phone ~ '^[6-9][0-9]{9}$'),
  message     text not null check (char_length(message) between 10 and 4000),
  is_handled  boolean not null default false,
  created_at  timestamptz not null default now()
);

create table public.drop_alerts (
  id          uuid primary key default gen_random_uuid(),
  email       text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  drop_id     uuid references public.drops (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique nulls not distinct (email, drop_id)
);
