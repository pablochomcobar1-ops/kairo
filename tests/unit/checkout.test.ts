import { describe, expect, it } from "vitest";
import { priceBag, type CheckoutStore, type StoredVariant } from "@/server/checkout/core";
import type { Coupon } from "@/lib/coupons";

const now = new Date("2026-11-01T10:00:00Z");
const product = (over: Partial<StoredVariant["product"]> = {}): StoredVariant["product"] => ({
  id: "p-tee",
  slug: "static-heavy-tee",
  name: "Static Heavy Tee",
  pricePaise: 220000,
  published: true,
  imagePath: "static-heavy-tee/1.avif",
  drop: null,
  ...over,
});
const V = (
  id: string,
  size: string,
  stock: number,
  over: Partial<StoredVariant["product"]> = {},
): StoredVariant => ({ id, size, colour: "Black", stock, product: product(over) });

function store(variants: StoredVariant[], coupons: Coupon[] = []): CheckoutStore {
  return {
    variants: async (ids) => variants.filter((v) => ids.includes(v.id)),
    coupon: async (code) => coupons.find((c) => c.code === code) ?? null,
  };
}

describe("priceBag", () => {
  it("ignores the browser's price: the database price is charged", async () => {
    // the bag in the browser may say ₹1; the input carries only ids and quantities
    const r = await priceBag(
      store([V("v-m", "M", 10)]),
      [{ variantId: "v-m", qty: 2 }],
      undefined,
      now,
    );
    expect(r.ok && r.lines[0].unitPaise).toBe(220000);
    expect(r.ok && r.totals).toEqual({ subtotal: 440000, discount: 0, shipping: 0, total: 440000 });
  });

  it("rejects a quantity above stock: 'Only 2 left in size M'", async () => {
    const r = await priceBag(
      store([V("v-m", "M", 2)]),
      [{ variantId: "v-m", qty: 3 }],
      undefined,
      now,
    );
    expect(r).toEqual({
      ok: false,
      error: "Only 2 left in size M of Static Heavy Tee.",
      variantId: "v-m",
    });
  });

  it("says sold out at zero stock", async () => {
    const r = await priceBag(
      store([V("v-m", "M", 0)]),
      [{ variantId: "v-m", qty: 1 }],
      undefined,
      now,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/sold out/);
  });

  it("refuses unknown or unpublished pieces", async () => {
    expect((await priceBag(store([]), [{ variantId: "ghost", qty: 1 }], undefined, now)).ok).toBe(
      false,
    );
    expect(
      (
        await priceBag(
          store([V("v", "M", 5, { published: false })]),
          [{ variantId: "v", qty: 1 }],
          undefined,
          now,
        )
      ).ok,
    ).toBe(false);
  });

  it("refuses drop pieces before the drop opens", async () => {
    const drop = { name: "Drop 01 — Night Shift", startsAt: "2026-11-05T14:30:00Z" };
    const r = await priceBag(
      store([V("v", "M", 5, { drop })]),
      [{ variantId: "v", qty: 1 }],
      undefined,
      now,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Drop 01.*opens/);
    const later = await priceBag(
      store([V("v", "M", 5, { drop })]),
      [{ variantId: "v", qty: 1 }],
      undefined,
      new Date("2026-11-06T00:00:00Z"),
    );
    expect(later.ok).toBe(true);
  });

  it("merges the same piece twice and still caps at 5", async () => {
    const r = await priceBag(
      store([V("v", "M", 50)]),
      [
        { variantId: "v", qty: 4 },
        { variantId: "v", qty: 4 },
      ],
      undefined,
      now,
    );
    expect(r.ok && r.lines).toHaveLength(1);
    expect(r.ok && r.lines[0].qty).toBe(5);
  });

  it("applies a valid coupon and explains an invalid one without failing the quote", async () => {
    const KAIRO10: Coupon = {
      code: "KAIRO10",
      kind: "percent",
      value: 10,
      min_subtotal_paise: 200000,
      starts_at: null,
      ends_at: null,
      max_uses: null,
      used_count: 0,
      is_active: true,
    };
    const ok = await priceBag(
      store([V("v", "M", 9)], [KAIRO10]),
      [{ variantId: "v", qty: 1 }],
      "KAIRO10",
      now,
    );
    expect(ok.ok && ok.coupon).toEqual({ code: "KAIRO10", discountPaise: 22000 });
    expect(ok.ok && ok.totals.total).toBe(220000 - 22000 + 14900);

    const bad = await priceBag(
      store([V("v", "M", 9)], [KAIRO10]),
      [{ variantId: "v", qty: 1 }],
      "NOPE",
      now,
    );
    expect(bad.ok && bad.coupon).toBeNull();
    expect(bad.ok && bad.couponError).toBe("That code isn't valid.");
  });
});
