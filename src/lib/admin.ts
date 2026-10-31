import { z } from "zod";
import type { OrderStatus } from "./orders";

/**
 * Rules for the admin panel, without Next.js or Supabase so they are tested.
 * The database enforces the same order rules (guard_order_status and the
 * admin_* functions); these decide which buttons to show.
 */

/** The one forward step each status may take (cancelling is separate: it restocks). */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: "packed",
  packed: "shipped",
  shipped: "delivered",
};

export const NEXT_STATUS_ACTION: Partial<Record<OrderStatus, string>> = {
  placed: "Mark packed",
  packed: "Mark shipped",
  shipped: "Mark delivered",
};

export const canCancel = (status: OrderStatus) => status === "placed" || status === "packed";

/** Unpaid checkouts older than this are cleared (Razorpay won't take a payment for them by then). */
export const ABANDONED_AFTER_HOURS = 24;

export const LOW_STOCK = 3;

export const ADMIN_ORDER_FILTERS = [
  "all",
  "placed",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
  "refund_due",
  "pending_payment",
] as const;
export type AdminOrderFilter = (typeof ADMIN_ORDER_FILTERS)[number];

export function parseOrderFilter(v: unknown): AdminOrderFilter {
  return ADMIN_ORDER_FILTERS.includes(v as AdminOrderFilter) ? (v as AdminOrderFilter) : "all";
}

export const REVIEW_FILTERS = ["pending", "approved", "rejected"] as const;
export type ReviewFilter = (typeof REVIEW_FILTERS)[number];
export const parseReviewFilter = (v: unknown): ReviewFilter =>
  REVIEW_FILTERS.includes(v as ReviewFilter) ? (v as ReviewFilter) : "pending";

/** Search box text: trimmed, short, and with characters that mean something to the database query removed. */
export function cleanSearch(v: unknown): string {
  return typeof v === "string"
    ? v
        .replace(/[^\p{L}\p{N}@.\- ]/gu, "")
        .trim()
        .slice(0, 60)
    : "";
}

const rupees = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{1,6}$/, `${label}: whole rupees, like 2200.`)
    .transform((v) => Number(v) * 100);

const copy = (label: string, max: number) =>
  z.string().trim().max(max, `${label} is too long (${max} characters at most).`);

/** The product edit form. Prices are typed in rupees and stored in paise. */
export const productEditSchema = z
  .object({
    name: z.string().trim().min(2, "Name is too short.").max(120, "Name is too long."),
    price: rupees("Price"),
    compareAt: z.union([z.literal("").transform(() => null), rupees("Was price")]),
    published: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
    description: copy("Description", 1200),
    fabric: copy("Fabric", 200),
    fit: copy("Fit", 200),
    care: copy("Care", 200),
  })
  .superRefine((v, ctx) => {
    if (v.price < 100 * 100)
      ctx.addIssue({ code: "custom", path: ["price"], message: "Price must be at least ₹100." });
    if (v.compareAt !== null && v.compareAt <= v.price)
      ctx.addIssue({
        code: "custom",
        path: ["compareAt"],
        message: "The was price must be higher than the price, or empty.",
      });
  });

/** Stock per variant from the edit form: fields named "stock:<variant id>". */
export function parseStock(form: Iterable<[string, FormDataEntryValue]>): {
  stock: Map<string, number>;
  error: string | null;
} {
  const stock = new Map<string, number>();
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  for (const [key, value] of form) {
    if (!key.startsWith("stock:")) continue;
    const id = key.slice(6);
    if (!UUID.test(id)) return { stock, error: "Unknown size in the stock table." };
    const n =
      typeof value === "string" && /^\d{1,4}$/.test(value.trim()) ? Number(value.trim()) : NaN;
    if (!Number.isInteger(n))
      return { stock, error: "Stock must be a whole number from 0 to 9999." };
    stock.set(id, n);
  }
  return { stock, error: null };
}
