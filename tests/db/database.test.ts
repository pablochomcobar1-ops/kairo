// @vitest-environment node
import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "./harness";

const ALICE = "11111111-1111-4111-8111-111111111111";
const BOB = "22222222-2222-4222-8222-222222222222";
const ADMIN = "33333333-3333-4333-8333-333333333333";

let t: TestDb;

/** Insert a pending order for `userId` with one item of the given variant, as the server would. */
async function createOrder(userId: string | null, variantId: string, qty: number, coupon?: string) {
  const v = await t.db.query<{ product_id: string; price_paise: number; name: string; slug: string; size: string; colour: string }>(
    `select v.product_id, p.price_paise, p.name, p.slug, v.size, v.colour
       from public.variants v join public.products p on p.id = v.product_id
      where v.id = $1`,
    [variantId],
  );
  const item = v.rows[0];
  const subtotal = item.price_paise * qty;
  const order = await t.db.query<{ id: string; number: string }>(
    `insert into public.orders (user_id, email, phone, subtotal_paise, discount_paise, shipping_paise, total_paise, coupon_code, shipping_address)
     values ($1, 'buyer@example.com', '9876543210', $2, 0, 0, $2, $3, '{"city":"Ahmedabad"}')
     returning id, number`,
    [userId, subtotal, coupon ?? null],
  );
  await t.db.query(
    `insert into public.order_items (order_id, product_id, variant_id, product_name, product_slug, size, colour, unit_price_paise, qty)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [order.rows[0].id, item.product_id, variantId, item.name, item.slug, item.size, item.colour, item.price_paise, qty],
  );
  return order.rows[0];
}

async function firstVariant(productSlug: string) {
  const r = await t.db.query<{ id: string; stock: number }>(
    `select v.id, v.stock from public.variants v join public.products p on p.id = v.product_id
      where p.slug = $1 order by v.position limit 1`,
    [productSlug],
  );
  return r.rows[0];
}

beforeAll(async () => {
  t = await createTestDb();
  await t.createUser(ALICE, { name: "Alice" });
  await t.createUser(BOB, { name: "Bob" });
  await t.createUser(ADMIN, { name: "Admin", admin: true });
}, 60_000);

describe("seed", () => {
  it("has 4 collections and 32 published products, 8 per collection", async () => {
    const c = await t.db.query<{ n: number }>("select count(*)::int n from public.collections");
    expect(c.rows[0].n).toBe(4);
    const per = await t.db.query<{ slug: string; n: number }>(
      `select c.slug, count(p.*)::int n from public.collections c
         join public.products p on p.collection_id = c.id and p.is_published
        group by c.slug order by c.slug`,
    );
    expect(per.rows).toEqual([
      { slug: "formal", n: 8 },
      { slug: "old-money", n: 8 },
      { slug: "riding", n: 8 },
      { slug: "streetwear", n: 8 },
    ]);
  });

  it("gives every product stock, two images, 3 look pairings and one other-way pairing", async () => {
    const r = await t.db.query<{ bad: number }>(
      `select count(*)::int bad from public.products p where
         (select count(*) from public.variants v where v.product_id = p.id and v.stock > 0) = 0
      or (select count(*) from public.product_images i where i.product_id = p.id) <> 2
      or (select count(*) from public.product_pairings x where x.product_id = p.id and x.kind = 'look') <> 3
      or (select count(*) from public.product_pairings x where x.product_id = p.id and x.kind = 'another_way') <> 1`,
    );
    expect(r.rows[0].bad).toBe(0);
  });

  it("keeps every price inside the brief's ₹1,800–₹18,000 band", async () => {
    const r = await t.db.query<{ lo: number; hi: number }>(
      "select min(price_paise)::int lo, max(price_paise)::int hi from public.products",
    );
    expect(r.rows[0].lo).toBeGreaterThanOrEqual(180_000);
    expect(r.rows[0].hi).toBeLessThanOrEqual(1_800_000);
  });

  it("marks every seeded review as a sample, never verified", async () => {
    const r = await t.db.query<{ total: number; samples: number; verified: number }>(
      `select count(*)::int total, count(*) filter (where is_sample)::int samples,
              count(*) filter (where is_verified)::int verified from public.reviews`,
    );
    expect(r.rows[0].total).toBeGreaterThan(0);
    expect(r.rows[0].samples).toBe(r.rows[0].total);
    expect(r.rows[0].verified).toBe(0);
  });

  it("schedules the drop in the future", async () => {
    const r = await t.db.query<{ future: boolean }>(
      "select starts_at > now() future from public.drops where slug = 'drop-01-night-shift'",
    );
    expect(r.rows[0].future).toBe(true);
  });
});

describe("row level security", () => {
  it("hides unpublished products from visitors but not from admins", async () => {
    await t.db.query("update public.products set is_published = false where slug = 'knit-silk-tie'");
    const anon = await t.as("anon", null, (d) =>
      d.query("select 1 from public.products where slug = 'knit-silk-tie'"),
    );
    const admin = await t.as("authenticated", ADMIN, (d) =>
      d.query("select 1 from public.products where slug = 'knit-silk-tie'"),
    );
    const variantsAnon = await t.as("anon", null, (d) =>
      d.query(
        "select 1 from public.variants v join public.products p on p.id = v.product_id where p.slug = 'knit-silk-tie'",
      ),
    );
    await t.db.query("update public.products set is_published = true where slug = 'knit-silk-tie'");
    expect(anon.rows).toHaveLength(0);
    expect(variantsAnon.rows).toHaveLength(0);
    expect(admin.rows).toHaveLength(1);
  });

  it("lets visitors read the published catalog", async () => {
    const r = await t.as("anon", null, (d) =>
      d.query<{ n: number }>("select count(*)::int n from public.products"),
    );
    expect(r.rows[0].n).toBe(32);
  });

  it("stops a shopper from changing products; an admin can", async () => {
    await expect(
      t.as("authenticated", ALICE, (d) =>
        d.query("update public.products set price_paise = 100 where slug = 'static-heavy-tee' returning id"),
      ),
    ).resolves.toMatchObject({ rows: [] });
    const asAdmin = await t.as("authenticated", ADMIN, (d) =>
      d.query("update public.products set fit = fit where slug = 'static-heavy-tee' returning id"),
    );
    expect(asAdmin.rows).toHaveLength(1);
  });

  it("never shows coupons to visitors or shoppers", async () => {
    await expect(
      t.as("anon", null, (d) => d.query("select code from public.coupons")),
    ).rejects.toThrow(/permission denied/);
    const shopper = await t.as("authenticated", ALICE, (d) => d.query("select code from public.coupons"));
    expect(shopper.rows).toHaveLength(0);
  });

  it("does not let visitors or shoppers create orders directly", async () => {
    const insert = `insert into public.orders (email, phone, subtotal_paise, total_paise, shipping_address)
                    values ('x@example.com', '9876543210', 100, 100, '{}')`;
    await expect(t.as("anon", null, (d) => d.query(insert))).rejects.toThrow(/permission denied/);
    await expect(t.as("authenticated", ALICE, (d) => d.query(insert))).rejects.toThrow(/permission denied/);
  });

  it("shows a shopper their own orders and never someone else's", async () => {
    const v = await firstVariant("signal-graphic-tee");
    const bobs = await createOrder(BOB, v.id, 1);
    const alice = await t.as("authenticated", ALICE, (d) =>
      d.query("select id from public.orders where id = $1", [bobs.id]),
    );
    const bob = await t.as("authenticated", BOB, (d) =>
      d.query("select id from public.orders where id = $1", [bobs.id]),
    );
    const aliceItems = await t.as("authenticated", ALICE, (d) =>
      d.query("select id from public.order_items where order_id = $1", [bobs.id]),
    );
    expect(alice.rows).toHaveLength(0);
    expect(aliceItems.rows).toHaveLength(0);
    expect(bob.rows).toHaveLength(1);
  });

  it("does not let a shopper make themselves admin", async () => {
    await expect(
      t.as("authenticated", ALICE, (d) =>
        d.query("update public.profiles set role = 'admin' where id = $1", [ALICE]),
      ),
    ).rejects.toThrow(/permission denied/);
    const ok = await t.as("authenticated", ALICE, (d) =>
      d.query("update public.profiles set full_name = 'Alice K' where id = $1 returning id", [ALICE]),
    );
    expect(ok.rows).toHaveLength(1);
  });

  it("keeps addresses private to their owner", async () => {
    await t.as("authenticated", ALICE, (d) =>
      d.query(
        `insert into public.addresses (user_id, name, phone, line1, city, state, pincode)
         values ($1, 'Alice', '9876543210', '12 Law Garden', 'Ahmedabad', 'Gujarat', '380006')`,
        [ALICE],
      ),
    );
    const bob = await t.as("authenticated", BOB, (d) => d.query("select id from public.addresses"));
    expect(bob.rows).toHaveLength(0);
    await expect(
      t.as("authenticated", BOB, (d) =>
        d.query(
          `insert into public.addresses (user_id, name, phone, line1, city, state, pincode)
           values ($1, 'Fake', '9876543210', '1 Street', 'Surat', 'Gujarat', '395001')`,
          [ALICE],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("hides pending reviews from everyone but their author and admins", async () => {
    const p = await t.db.query<{ id: string }>("select id from public.products where slug = 'pleated-chino'");
    await t.db.query(
      `insert into public.reviews (product_id, user_id, author_name, rating, title, body, status)
       values ($1, $2, 'Alice', 5, 'Lovely', 'Fits perfectly and feels great.', 'pending')`,
      [p.rows[0].id, ALICE],
    );
    const q = "select id from public.reviews where status = 'pending'";
    expect((await t.as("anon", null, (d) => d.query(q))).rows).toHaveLength(0);
    expect((await t.as("authenticated", BOB, (d) => d.query(q))).rows).toHaveLength(0);
    expect((await t.as("authenticated", ALICE, (d) => d.query(q))).rows).toHaveLength(1);
    expect((await t.as("authenticated", ADMIN, (d) => d.query(q))).rows).toHaveLength(1);
  });

  it("does not let browsers call the payment function", async () => {
    await expect(
      t.as("anon", null, (d) =>
        d.query("select public.mark_order_paid(gen_random_uuid(), 'pay_x')"),
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(
      t.as("authenticated", ALICE, (d) =>
        d.query("select public.mark_order_paid(gen_random_uuid(), 'pay_x')"),
      ),
    ).rejects.toThrow(/permission denied/);
  });
});

describe("orders", () => {
  it("numbers orders like KRO-YYMMDD-XXXX", async () => {
    const v = await firstVariant("pleated-chino");
    const o = await createOrder(ALICE, v.id, 1);
    expect(o.number).toMatch(/^KRO-\d{6}-[A-HJ-NP-Z2-9]{4}$/);
  });

  it("mark_order_paid is idempotent: stock and coupon use drop exactly once", async () => {
    const v = await firstVariant("riviera-camp-shirt");
    const before = await t.db.query<{ used: number }>("select used_count used from public.coupons where code = 'KAIRO10'");
    const o = await createOrder(ALICE, v.id, 2, "KAIRO10");

    const first = await t.as("service_role", null, (d) =>
      d.query<{ r: string }>("select public.mark_order_paid($1, 'pay_1') r", [o.id]),
    );
    const second = await t.as("service_role", null, (d) =>
      d.query<{ r: string }>("select public.mark_order_paid($1, 'pay_1') r", [o.id]),
    );
    expect(first.rows[0].r).toBe("paid");
    expect(second.rows[0].r).toBe("already_paid");

    const after = await t.db.query<{ stock: number }>("select stock from public.variants where id = $1", [v.id]);
    expect(after.rows[0].stock).toBe(v.stock - 2);
    const usedAfter = await t.db.query<{ used: number }>("select used_count used from public.coupons where code = 'KAIRO10'");
    expect(usedAfter.rows[0].used).toBe(before.rows[0].used + 1);

    const order = await t.db.query<{ status: string; payment_status: string }>(
      "select status, payment_status from public.orders where id = $1",
      [o.id],
    );
    expect(order.rows[0]).toEqual({ status: "placed", payment_status: "paid" });
  });

  it("cancels and flags a refund when stock ran out before payment landed", async () => {
    const v = await firstVariant("gauntlet-gloves");
    await t.db.query("update public.variants set stock = 1 where id = $1", [v.id]);
    const o = await createOrder(BOB, v.id, 2);
    const r = await t.as("service_role", null, (d) =>
      d.query<{ r: string }>("select public.mark_order_paid($1, 'pay_2') r", [o.id]),
    );
    expect(r.rows[0].r).toBe("paid_out_of_stock");
    const order = await t.db.query<{ status: string; payment_status: string }>(
      "select status, payment_status from public.orders where id = $1",
      [o.id],
    );
    expect(order.rows[0]).toEqual({ status: "cancelled", payment_status: "refund_due" });
    const stock = await t.db.query<{ stock: number }>("select stock from public.variants where id = $1", [v.id]);
    expect(stock.rows[0].stock).toBe(1);
    const note = await t.db.query<{ note: string }>(
      "select note from public.order_events where order_id = $1 and status = 'cancelled'",
      [o.id],
    );
    expect(note.rows).toHaveLength(1);
    expect(note.rows[0].note).toMatch(/sold out\. Refund due\./);
  });

  it("only lets order status move forward, and logs each step", async () => {
    const v = await firstVariant("cable-knit-polo");
    const o = await createOrder(ALICE, v.id, 1);
    await t.as("service_role", null, (d) => d.query("select public.mark_order_paid($1, 'pay_3')", [o.id]));

    await t.as("authenticated", ADMIN, (d) =>
      d.query("update public.orders set status = 'packed' where id = $1", [o.id]),
    );
    await expect(
      t.as("authenticated", ADMIN, (d) =>
        d.query("update public.orders set status = 'placed' where id = $1", [o.id]),
      ),
    ).rejects.toThrow(/cannot go from packed to placed/);

    const events = await t.db.query<{ status: string }>(
      "select status from public.order_events where order_id = $1 order by id",
      [o.id],
    );
    expect(events.rows.map((e) => e.status)).toEqual(["pending_payment", "placed", "packed"]);
  });

  it("does not let a shopper change their own order's status", async () => {
    const v = await firstVariant("pleated-chino");
    const o = await createOrder(ALICE, v.id, 1);
    const r = await t.as("authenticated", ALICE, (d) =>
      d.query("update public.orders set status = 'cancelled' where id = $1 returning id", [o.id]),
    );
    expect(r.rows).toHaveLength(0);
  });

  it("counts someone as a verified buyer only after a paid order for that product", async () => {
    const v = await firstVariant("club-stripe-rugby");
    const pid = await t.db.query<{ id: string }>("select id from public.products where slug = 'club-stripe-rugby'");
    const check = () =>
      t.as("service_role", null, (d) =>
        d.query<{ ok: boolean }>("select public.is_verified_buyer($1, $2) ok", [BOB, pid.rows[0].id]),
      );
    const o = await createOrder(BOB, v.id, 1);
    expect((await check()).rows[0].ok).toBe(false);
    await t.as("service_role", null, (d) => d.query("select public.mark_order_paid($1, 'pay_4')", [o.id]));
    expect((await check()).rows[0].ok).toBe(true);
  });
});

describe("constraints", () => {
  it("rejects a bad pincode, phone or rating at the database level", async () => {
    await expect(
      t.db.query(
        `insert into public.addresses (user_id, name, phone, line1, city, state, pincode)
         values ($1, 'A', '12345', 'x', 'y', 'z', '0000')`,
        [ALICE],
      ),
    ).rejects.toThrow(/check constraint/);
    const p = await t.db.query<{ id: string }>("select id from public.products limit 1");
    await expect(
      t.db.query(
        `insert into public.reviews (product_id, author_name, rating, title, body) values ($1, 'Al', 6, 'Hi', 'Long enough body')`,
        [p.rows[0].id],
      ),
    ).rejects.toThrow(/check constraint/);
  });

  it("refuses an order whose total does not add up", async () => {
    await expect(
      t.db.query(
        `insert into public.orders (email, phone, subtotal_paise, discount_paise, shipping_paise, total_paise, shipping_address)
         values ('a@example.com', '9876543210', 1000, 0, 0, 1, '{}')`,
      ),
    ).rejects.toThrow(/check constraint/);
  });
});

describe("admin order actions", () => {
  const paidOrder = async (slug: string, qty: number, pay: string) => {
    const v = await firstVariant(slug);
    const o = await createOrder(ALICE, v.id, qty);
    await t.as("service_role", null, (d) =>
      d.query("select public.mark_order_paid($1, $2)", [o.id, pay]),
    );
    return { o, v };
  };
  const stockOf = async (id: string) =>
    (await t.db.query<{ stock: number }>("select stock from public.variants where id = $1", [id]))
      .rows[0].stock;

  it("cancelling a paid order puts the stock back and flags a refund, with the reason logged", async () => {
    const { o, v } = await paidOrder("heirloom-overshirt", 2, "pay_a1");
    expect(await stockOf(v.id)).toBe(v.stock - 2);
    const r = await t.as("authenticated", ADMIN, (d) =>
      d.query<{ r: string }>("select public.admin_cancel_order($1, 'Customer asked to cancel') r", [
        o.id,
      ]),
    );
    expect(r.rows[0].r).toBe("cancelled");
    expect(await stockOf(v.id)).toBe(v.stock);
    const order = await t.db.query<{ status: string; payment_status: string }>(
      "select status, payment_status from public.orders where id = $1",
      [o.id],
    );
    expect(order.rows[0]).toEqual({ status: "cancelled", payment_status: "refund_due" });
    const ev = await t.db.query<{ note: string }>(
      "select note from public.order_events where order_id = $1 and status = 'cancelled'",
      [o.id],
    );
    expect(ev.rows[0].note).toBe("Customer asked to cancel");

    // a second cancel changes nothing
    const again = await t.as("authenticated", ADMIN, (d) =>
      d.query<{ r: string }>("select public.admin_cancel_order($1, null) r", [o.id]),
    );
    expect(again.rows[0].r).toBe("not_allowed");
    expect(await stockOf(v.id)).toBe(v.stock);

    // then the refund is recorded once
    const refund = () =>
      t.as("authenticated", ADMIN, (d) =>
        d.query<{ r: string }>("select public.admin_mark_refunded($1) r", [o.id]),
      );
    expect((await refund()).rows[0].r).toBe("refunded");
    expect((await refund()).rows[0].r).toBe("not_allowed");
  });

  it("a shipped order can't be cancelled", async () => {
    const { o } = await paidOrder("linen-weekend-trouser", 1, "pay_a2");
    await t.as("authenticated", ADMIN, async (d) => {
      await d.query("update public.orders set status = 'packed' where id = $1", [o.id]);
      await d.query("update public.orders set status = 'shipped' where id = $1", [o.id]);
    });
    const r = await t.as("authenticated", ADMIN, (d) =>
      d.query<{ r: string }>("select public.admin_cancel_order($1, null) r", [o.id]),
    );
    expect(r.rows[0].r).toBe("not_allowed");
  });

  it("shoppers and visitors can't use the admin functions", async () => {
    const { o } = await paidOrder("riviera-camp-shirt", 1, "pay_a3");
    await expect(
      t.as("authenticated", ALICE, (d) =>
        d.query("select public.admin_cancel_order($1, null)", [o.id]),
      ),
    ).rejects.toThrow(/admins only/);
    await expect(
      t.as("authenticated", BOB, (d) => d.query("select public.admin_clear_abandoned(1)")),
    ).rejects.toThrow(/admins only/);
    await expect(
      t.as("anon", null, (d) => d.query("select public.admin_mark_refunded($1)", [o.id])),
    ).rejects.toThrow(/permission denied/);
  });

  it("clears only unpaid checkouts older than the cut-off", async () => {
    const v = await firstVariant("pleated-chino");
    const old = await createOrder(BOB, v.id, 1);
    const fresh = await createOrder(BOB, v.id, 1);
    const { o: paid } = await paidOrder("cable-knit-polo", 1, "pay_a4");
    await t.db.query(
      "update public.orders set created_at = now() - interval '30 hours' where id = any($1)",
      [[old.id, paid.id]],
    );
    const n = await t.as("authenticated", ADMIN, (d) =>
      d.query<{ n: number }>("select public.admin_clear_abandoned(24) n"),
    );
    expect(n.rows[0].n).toBeGreaterThanOrEqual(1);
    const left = await t.db.query<{ id: string }>(
      "select id from public.orders where id = any($1)",
      [[old.id, fresh.id, paid.id]],
    );
    expect(left.rows.map((r) => r.id).sort()).toEqual([fresh.id, paid.id].sort());
  });
});
