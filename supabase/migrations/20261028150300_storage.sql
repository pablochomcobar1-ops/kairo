-- =====================================================================
-- KAIRO — Storage buckets
--   products  public read (catalog photos), admin upload
--   reviews   private; photos are served through short-lived signed URLs
--             after a review is approved. Uploads go through the server.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('products', 'products', true,  8388608, array['image/avif', 'image/webp', 'image/jpeg', 'image/png']),
  ('reviews',  'reviews',  false, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "products bucket: public read" on storage.objects for select
  using (bucket_id = 'products');

create policy "products bucket: admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'products' and public.is_admin());

create policy "products bucket: admin update" on storage.objects for update to authenticated
  using (bucket_id = 'products' and public.is_admin());

create policy "products bucket: admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'products' and public.is_admin());

create policy "reviews bucket: admin read" on storage.objects for select to authenticated
  using (bucket_id = 'reviews' and public.is_admin());

create policy "reviews bucket: admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'reviews' and public.is_admin());
