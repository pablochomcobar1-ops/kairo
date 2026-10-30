/** A coupon as stored in the database (only the fields the rules need). */
export interface Coupon {
  code: string;
  kind: "percent" | "fixed";
  /** percent: whole number 1–90; fixed: paise */
  value: number;
  min_subtotal_paise: number;
  starts_at: string | null;
  ends_at: string | null;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
}

export type CouponResult =
  | { ok: true; discountPaise: number }
  | {
      ok: false;
      reason: "not_found" | "inactive" | "expired" | "not_started" | "min_subtotal" | "used_up";
    };

/** Whether a coupon applies to this subtotal right now, and how much it takes off. */
export function validateCoupon(
  coupon: Coupon | null,
  subtotalPaise: number,
  now: Date,
): CouponResult {
  if (!coupon) return { ok: false, reason: "not_found" };
  if (!coupon.is_active) return { ok: false, reason: "inactive" };
  if (coupon.starts_at && new Date(coupon.starts_at) > now)
    return { ok: false, reason: "not_started" };
  if (coupon.ends_at && new Date(coupon.ends_at) <= now) return { ok: false, reason: "expired" };
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses)
    return { ok: false, reason: "used_up" };
  if (subtotalPaise < coupon.min_subtotal_paise) return { ok: false, reason: "min_subtotal" };

  const raw =
    coupon.kind === "percent" ? Math.floor((subtotalPaise * coupon.value) / 100) : coupon.value;
  return { ok: true, discountPaise: Math.max(0, Math.min(raw, subtotalPaise)) };
}

/** What to tell the shopper when a code doesn't apply. */
export function couponMessage(
  reason: Exclude<CouponResult, { ok: true }>["reason"],
  minSubtotalPaise?: number,
): string {
  switch (reason) {
    case "min_subtotal":
      return minSubtotalPaise
        ? `This code needs a bag of at least ₹${(minSubtotalPaise / 100).toLocaleString("en-IN")}.`
        : "Your bag is below this code's minimum.";
    case "expired":
      return "This code has expired.";
    case "not_started":
      return "This code isn't active yet.";
    case "used_up":
      return "This code has been fully used.";
    default:
      return "That code isn't valid.";
  }
}
