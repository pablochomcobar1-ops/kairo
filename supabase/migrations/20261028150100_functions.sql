-- =====================================================================
-- KAIRO — functions and triggers
-- security definer functions pin search_path so they can't be hijacked.
-- =====================================================================

-- ---------- Who is an admin ----------
create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------- New sign-up → profile row ----------
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Users may never promote themselves ----------
create function public.protect_profile_role() returns trigger
language plpgsql as $$
begin
  if new.role is distinct from old.role and not public.is_admin()
     and current_user not in ('postgres', 'service_role', 'supabase_admin') then
    raise exception 'role can only be changed by an admin' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role before update on public.profiles
  for each row execute function public.protect_profile_role();

-- ---------- Order numbers: KRO-YYMMDD-XXXX (no 0/O/1/I to avoid misreads) ----------
create function public.generate_order_number() returns text
language plpgsql volatile as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  suffix text := '';
begin
  for i in 1..4 loop
    suffix := suffix || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return 'KRO-' || to_char(now() at time zone 'Asia/Kolkata', 'YYMMDD') || '-' || suffix;
end;
$$;

alter table public.orders alter column number set default public.generate_order_number();

-- ---------- Order status may only move forward; every change is logged ----------
-- security definer: the history row is written by the database itself, so the admin
-- (or the server) changing the status doesn't need insert rights on order_events.
create function public.guard_order_status() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  allowed boolean;
begin
  if new.status = old.status then
    return new;
  end if;

  allowed := case old.status
    when 'pending_payment' then new.status in ('placed', 'cancelled')
    when 'placed'          then new.status in ('packed', 'cancelled')
    when 'packed'          then new.status in ('shipped', 'cancelled')
    when 'shipped'         then new.status in ('delivered')
    else false
  end;

  if not allowed then
    raise exception 'order status cannot go from % to %', old.status, new.status
      using errcode = '22023';
  end if;

  insert into public.order_events (order_id, status) values (new.id, new.status);
  return new;
end;
$$;

create trigger orders_guard_status before update of status on public.orders
  for each row execute function public.guard_order_status();

create function public.log_order_created() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.order_events (order_id, status) values (new.id, new.status);
  return new;
end;
$$;

create trigger orders_log_created after insert on public.orders
  for each row execute function public.log_order_created();

-- ---------- Payment confirmed → order placed (idempotent) ----------
-- Called by the server after a verified Razorpay signature or webhook.
-- Returns:
--   'paid'               first confirmation; stock and coupon use updated
--   'already_paid'       a repeat (webhook retry, or callback + webhook); nothing changed
--   'paid_out_of_stock'  paid, but stock ran out meanwhile; order cancelled, refund due
--   'not_found'          no such order
create function public.mark_order_paid(p_order_id uuid, p_payment_id text) returns text
language plpgsql security definer set search_path = public as $$
declare
  o public.orders%rowtype;
  short_item record;
begin
  select * into o from public.orders where id = p_order_id for update;
  if not found then
    return 'not_found';
  end if;

  if o.payment_status in ('paid', 'refund_due', 'refunded') then
    return 'already_paid';
  end if;

  -- lock every variant in the order, then check there is enough of each
  perform 1 from public.variants v
    join public.order_items oi on oi.variant_id = v.id
    where oi.order_id = p_order_id
    for update of v;

  select oi.product_name, oi.size into short_item
    from public.order_items oi
    left join public.variants v on v.id = oi.variant_id
    where oi.order_id = p_order_id and (v.id is null or v.stock < oi.qty)
    limit 1;

  if found then
    update public.orders
       set payment_status = 'refund_due',
           razorpay_payment_id = p_payment_id,
           paid_at = now(),
           status = 'cancelled'
     where id = p_order_id;
    -- the status trigger just logged 'cancelled'; attach the reason to that event
    update public.order_events
       set note = 'Paid but ' || short_item.product_name || ' (' || short_item.size || ') sold out. Refund due.'
     where id = (select max(id) from public.order_events where order_id = p_order_id);
    return 'paid_out_of_stock';
  end if;

  update public.variants v
     set stock = v.stock - oi.qty
    from public.order_items oi
   where oi.order_id = p_order_id and oi.variant_id = v.id;

  if o.coupon_code is not null then
    update public.coupons set used_count = used_count + 1 where code = o.coupon_code;
  end if;

  update public.orders
     set payment_status = 'paid',
         razorpay_payment_id = p_payment_id,
         paid_at = now(),
         status = 'placed'
   where id = p_order_id;

  return 'paid';
end;
$$;

-- ---------- Has this user bought this product? (for "Verified buyer") ----------
create function public.is_verified_buyer(p_user_id uuid, p_product_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.order_items oi
    join public.orders o on o.id = oi.order_id
    where o.user_id = p_user_id
      and o.payment_status = 'paid'
      and oi.product_id = p_product_id
  );
$$;

-- ---------- Who may call what ----------
revoke execute on function public.mark_order_paid(uuid, text)        from public, anon, authenticated;
revoke execute on function public.is_verified_buyer(uuid, uuid)       from public, anon, authenticated;
revoke execute on function public.generate_order_number()             from public, anon, authenticated;
grant  execute on function public.mark_order_paid(uuid, text)        to service_role;
grant  execute on function public.is_verified_buyer(uuid, uuid)       to service_role;
grant  execute on function public.generate_order_number()             to service_role;
grant  execute on function public.is_admin()                          to anon, authenticated, service_role;
