/**
 * Shop rules (Stage 3 plan). The server recomputes every total from database
 * prices at checkout (Task 9); these constants are shared so the cart drawer
 * and the server agree on the rules.
 */

/** Free shipping when the order (after discount) is ₹3,000 or more. */
export const FREE_SHIPPING_THRESHOLD_PAISE = 300_000;
/** Otherwise shipping costs ₹149. */
export const SHIPPING_FEE_PAISE = 14_900;
/** Most of one size/colour per order. */
export const MAX_QTY_PER_LINE = 5;

/** How far a bag is from free shipping, for the progress bar in the cart. */
export function freeShippingProgress(subtotalPaise: number) {
  const remainingPaise = Math.max(0, FREE_SHIPPING_THRESHOLD_PAISE - subtotalPaise);
  return {
    remainingPaise,
    ratio: Math.min(1, Math.max(0, subtotalPaise) / FREE_SHIPPING_THRESHOLD_PAISE),
    unlocked: remainingPaise === 0,
  };
}

/** Clamp any quantity to a whole number between 1 and the per-line maximum. */
export function clampQty(qty: number): number {
  if (!Number.isFinite(qty)) return 1;
  return Math.min(MAX_QTY_PER_LINE, Math.max(1, Math.floor(qty)));
}

export interface Totals {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

/**
 * The order total, all in paise. Shipping is free when the subtotal AFTER the
 * discount reaches ₹3,000. The discount can never exceed the subtotal.
 */
export function computeTotals(
  items: { unitPaise: number; qty: number }[],
  discountPaise: number,
): Totals {
  const subtotal = items.reduce((n, i) => n + i.unitPaise * i.qty, 0);
  const discount = Math.min(subtotal, Math.max(0, Math.floor(discountPaise)));
  const afterDiscount = subtotal - discount;
  const shipping =
    subtotal === 0 || afterDiscount >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : SHIPPING_FEE_PAISE;
  return { subtotal, discount, shipping, total: afterDiscount + shipping };
}
