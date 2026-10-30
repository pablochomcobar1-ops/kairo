import { computeTotals, MAX_QTY_PER_LINE, type Totals } from "@/lib/pricing";
import { couponMessage, validateCoupon, type Coupon } from "@/lib/coupons";
import { dropDateIST } from "@/lib/countdown";

/**
 * Pricing a bag, the only way the site ever prices one: from the database.
 * Prices, names and stock in the browser's bag are ignored; only variant ids
 * and quantities are used. No Next.js or Supabase here, so it is unit-tested
 * with an in-memory store.
 */

export interface StoredVariant {
  id: string;
  size: string;
  colour: string;
  stock: number;
  product: {
    id: string;
    slug: string;
    name: string;
    pricePaise: number;
    published: boolean;
    imagePath: string | null;
    drop: { name: string; startsAt: string } | null;
  };
}

export interface CheckoutStore {
  variants(ids: string[]): Promise<StoredVariant[]>;
  coupon(code: string): Promise<Coupon | null>;
}

export interface PricedLine {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  size: string;
  colour: string;
  imagePath: string | null;
  unitPaise: number;
  qty: number;
}

export type PriceResult =
  | {
      ok: true;
      lines: PricedLine[];
      totals: Totals;
      coupon: { code: string; discountPaise: number } | null;
      couponError: string | null;
    }
  | { ok: false; error: string; variantId?: string };

export async function priceBag(
  store: CheckoutStore,
  items: { variantId: string; qty: number }[],
  couponCode: string | undefined,
  now: Date,
): Promise<PriceResult> {
  // the same variant twice counts once, still capped at 5
  const wanted = new Map<string, number>();
  for (const i of items)
    wanted.set(i.variantId, Math.min(MAX_QTY_PER_LINE, (wanted.get(i.variantId) ?? 0) + i.qty));
  if (wanted.size === 0) return { ok: false, error: "Your bag is empty." };

  const found = new Map((await store.variants([...wanted.keys()])).map((v) => [v.id, v]));
  const lines: PricedLine[] = [];

  for (const [variantId, qty] of wanted) {
    const v = found.get(variantId);
    if (!v || !v.product.published) {
      return {
        ok: false,
        error: "One piece in your bag is no longer available. Remove it to continue.",
        variantId,
      };
    }
    if (v.product.drop && new Date(v.product.drop.startsAt) > now) {
      return {
        ok: false,
        error: `${v.product.name} is part of ${v.product.drop.name.split("—")[0].trim()}, which opens ${dropDateIST(v.product.drop.startsAt)}.`,
        variantId,
      };
    }
    if (v.stock < qty) {
      return {
        ok: false,
        error:
          v.stock <= 0
            ? `${v.product.name} in size ${v.size} is sold out.`
            : `Only ${v.stock} left in size ${v.size} of ${v.product.name}.`,
        variantId,
      };
    }
    lines.push({
      variantId,
      productId: v.product.id,
      slug: v.product.slug,
      name: v.product.name,
      size: v.size,
      colour: v.colour,
      imagePath: v.product.imagePath,
      unitPaise: v.product.pricePaise,
      qty,
    });
  }

  const subtotal = computeTotals(lines, 0).subtotal;
  let coupon: { code: string; discountPaise: number } | null = null;
  let couponError: string | null = null;
  if (couponCode) {
    const c = await store.coupon(couponCode);
    const result = validateCoupon(c, subtotal, now);
    if (result.ok) coupon = { code: couponCode, discountPaise: result.discountPaise };
    else couponError = couponMessage(result.reason, c?.min_subtotal_paise);
  }

  return {
    ok: true,
    lines,
    totals: computeTotals(lines, coupon?.discountPaise ?? 0),
    coupon,
    couponError,
  };
}
