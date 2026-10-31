-- Task 12: admin actions on orders that change more than one table.
-- Each function checks is_admin() (the signed-in user's role) itself, so it is
-- called with the admin's own session and is useless to anyone else.
-- Note: inside a security definer function current_user is the function's
-- owner, so it must never be used to decide who is calling.

create function public.assert_admin() returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not coalesce(public.is_admin(), false) then
    raise exception 'admins only' using errcode = '42501';
  end if;
end;
$$;

-- ---------- Cancel a placed or packed order ----------
-- Stock taken at payment goes back on the shelf, a paid order is flagged
-- "refund due", and the reason is attached to the 'cancelled' history entry.
-- Returns 'cancelled', 'not_allowed' (pending, shipped, delivered or already
-- cancelled) or 'not_found'.
create function public.admin_cancel_order(p_order_id uuid, p_note text) returns text
language plpgsql security definer set search_path = public as $$
declare
  o public.orders%rowtype;
begin
  perform public.assert_admin();

  select * into o from public.orders where id = p_order_id for update;
  if not found then
    return 'not_found';
  end if;
  if o.status not in ('placed', 'packed') then
    return 'not_allowed';
  end if;

  if o.payment_status = 'paid' then
    update public.variants v
       set stock = v.stock + s.qty
      from (select variant_id, sum(qty)::int as qty
              from public.order_items
             where order_id = p_order_id and variant_id is not null
             group by variant_id) s
     where v.id = s.variant_id;
  end if;

  update public.orders
     set status = 'cancelled',
         payment_status = case when payment_status = 'paid' then 'refund_due'::public.payment_status
                               else payment_status end
   where id = p_order_id;

  update public.order_events
     set note = left(nullif(btrim(coalesce(p_note, '')), ''), 300)
   where id = (select max(id) from public.order_events where order_id = p_order_id);

  return 'cancelled';
end;
$$;

-- ---------- Record that a refund was made (in the Razorpay dashboard) ----------
-- Returns 'refunded', 'not_allowed' (no refund was due) or 'not_found'.
create function public.admin_mark_refunded(p_order_id uuid) returns text
language plpgsql security definer set search_path = public as $$
declare
  o public.orders%rowtype;
begin
  perform public.assert_admin();

  select * into o from public.orders where id = p_order_id for update;
  if not found then
    return 'not_found';
  end if;
  if o.payment_status <> 'refund_due' then
    return 'not_allowed';
  end if;

  update public.orders set payment_status = 'refunded' where id = p_order_id;
  insert into public.order_events (order_id, status, note)
    values (p_order_id, o.status, 'Refund sent.');
  return 'refunded';
end;
$$;

-- ---------- Clear checkouts that were started and never paid ----------
-- Unpaid orders never took stock, so removing them changes nothing else.
-- Only orders with no payment at all, older than p_hours (at least 1, default 24:
-- long after Razorpay would still accept a payment for them). Returns how many.
create function public.admin_clear_abandoned(p_hours int default 24) returns int
language plpgsql security definer set search_path = public as $$
declare
  n int;
begin
  perform public.assert_admin();

  delete from public.orders
   where status = 'pending_payment'
     and payment_status in ('pending', 'failed')
     and razorpay_payment_id is null
     and paid_at is null
     and created_at < now() - make_interval(hours => greatest(coalesce(p_hours, 24), 1));
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke execute on function public.assert_admin()                     from public, anon;
revoke execute on function public.admin_cancel_order(uuid, text)     from public, anon;
revoke execute on function public.admin_mark_refunded(uuid)          from public, anon;
revoke execute on function public.admin_clear_abandoned(int)         from public, anon;
grant  execute on function public.assert_admin()                     to authenticated;
grant  execute on function public.admin_cancel_order(uuid, text)     to authenticated;
grant  execute on function public.admin_mark_refunded(uuid)          to authenticated;
grant  execute on function public.admin_clear_abandoned(int)         to authenticated;
