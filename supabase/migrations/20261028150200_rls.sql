-- =====================================================================
-- KAIRO — Row Level Security
-- Least privilege: start from nothing, grant exactly what each role needs,
-- then RLS narrows it to the rows that role may touch.
--   anon           visitors who are not logged in
--   authenticated  logged-in shoppers (and admins, checked with is_admin())
--   service_role   our server only; bypasses RLS; never reaches the browser
-- Writes that involve money, stock or trust (orders, reviews, contact
-- messages, drop alerts) happen only on the server with service_role.
-- =====================================================================

-- ---------- Start from zero ----------
revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;

-- ---------- Turn RLS on everywhere ----------
alter table public.profiles          enable row level security;
alter table public.addresses         enable row level security;
alter table public.collections       enable row level security;
alter table public.drops             enable row level security;
alter table public.products          enable row level security;
alter table public.product_images    enable row level security;
alter table public.variants          enable row level security;
alter table public.product_pairings  enable row level security;
alter table public.wishlist_items    enable row level security;
alter table public.coupons           enable row level security;
alter table public.orders            enable row level security;
alter table public.order_items       enable row level security;
alter table public.order_events      enable row level security;
alter table public.reviews           enable row level security;
alter table public.contact_messages  enable row level security;
alter table public.drop_alerts       enable row level security;

-- ---------- Catalog: everyone reads published items; admins write ----------
grant select on public.collections, public.drops, public.products, public.product_images,
                public.variants, public.product_pairings
  to anon, authenticated;
grant insert, update, delete on public.collections, public.drops, public.products,
                public.product_images, public.variants, public.product_pairings
  to authenticated;

create policy "collections: read" on public.collections for select using (true);
create policy "collections: admin write" on public.collections for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "drops: read" on public.drops for select using (true);
create policy "drops: admin write" on public.drops for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "products: read published" on public.products for select
  using (is_published or public.is_admin());
create policy "products: admin write" on public.products for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "product_images: read published" on public.product_images for select
  using (exists (select 1 from public.products p
                 where p.id = product_id and (p.is_published or public.is_admin())));
create policy "product_images: admin write" on public.product_images for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "variants: read published" on public.variants for select
  using (exists (select 1 from public.products p
                 where p.id = product_id and (p.is_published or public.is_admin())));
create policy "variants: admin write" on public.variants for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "pairings: read published" on public.product_pairings for select
  using (exists (select 1 from public.products p
                 where p.id = product_id and (p.is_published or public.is_admin())));
create policy "pairings: admin write" on public.product_pairings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- Profiles: you see and edit yourself (not your role) ----------
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

create policy "profiles: read own or admin" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ---------- Addresses and wishlist: yours only ----------
grant select, insert, update, delete on public.addresses, public.wishlist_items to authenticated;

create policy "addresses: own" on public.addresses for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "wishlist: own" on public.wishlist_items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Coupons: never readable by shoppers (validated on the server) ----------
grant select, insert, update, delete on public.coupons to authenticated;
create policy "coupons: admin only" on public.coupons for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- Orders: read your own; only admins change them ----------
grant select on public.orders, public.order_items, public.order_events to authenticated;
grant update (status) on public.orders to authenticated;

create policy "orders: read own or admin" on public.orders for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "orders: admin updates status" on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "order_items: read with order" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o
                 where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));

create policy "order_events: read with order" on public.order_events for select to authenticated
  using (exists (select 1 from public.orders o
                 where o.id = order_id and (o.user_id = auth.uid() or public.is_admin())));

-- ---------- Reviews: approved ones are public; you see your own pending ones ----------
grant select on public.reviews to anon, authenticated;
grant update (status), delete on public.reviews to authenticated;

create policy "reviews: read approved, own or admin" on public.reviews for select
  using (status = 'approved' or user_id = auth.uid() or public.is_admin());
create policy "reviews: admin moderates" on public.reviews for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "reviews: admin deletes" on public.reviews for delete to authenticated
  using (public.is_admin());

-- ---------- Inbound messages: admins read; the server writes ----------
grant select, update, delete on public.contact_messages to authenticated;
grant select, delete on public.drop_alerts to authenticated;

create policy "contact: admin" on public.contact_messages for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "drop_alerts: admin" on public.drop_alerts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
