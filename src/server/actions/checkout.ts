"use server";

import { z } from "zod";
import { productImageUrl } from "@/lib/images";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/orders";
import { checkoutSchema, fieldErrors, trackSchema } from "@/lib/validation";
import type { Totals } from "@/lib/pricing";
import { accountsEnabled, getUser } from "@/server/auth";
import { priceBag, type PricedLine } from "@/server/checkout/core";
import { completePayment } from "@/server/checkout/complete";
import { supabaseCheckoutStore } from "@/server/checkout/store";
import { clientIp, limit, tooMany } from "@/server/ratelimit";
import { createRazorpayOrder, razorpayKeys, verifyPaymentSignature } from "@/server/razorpay";
import { createAdminClient } from "@/server/supabase/admin";
import { createServerClient } from "@/server/supabase/server";

const bagSchema = z
  .array(z.object({ variantId: z.uuid(), qty: z.number().int().min(1).max(5) }))
  .min(1)
  .max(20);
const codeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{3,20}$/)
  .optional()
  .or(z.literal("").transform(() => undefined));

const UNAVAILABLE = "Checkout isn't switched on here yet (the database settings are missing).";

export type QuoteLine = Omit<PricedLine, "productId" | "imagePath"> & { image: string | null };
export type Quote =
  | {
      ok: true;
      lines: QuoteLine[];
      totals: Totals;
      coupon: { code: string; discountPaise: number } | null;
      couponError: string | null;
    }
  | { ok: false; error: string; variantId?: string };

const toQuoteLines = (lines: PricedLine[]): QuoteLine[] =>
  lines.map((l) => ({
    variantId: l.variantId,
    slug: l.slug,
    name: l.name,
    size: l.size,
    colour: l.colour,
    unitPaise: l.unitPaise,
    qty: l.qty,
    image: productImageUrl(l.imagePath),
  }));

/** Real prices, stock and coupon for the bag, before paying. Nothing is saved. */
export async function quoteCheckout(items: unknown, couponCode: unknown): Promise<Quote> {
  if (!accountsEnabled()) return { ok: false, error: UNAVAILABLE };
  const bag = bagSchema.safeParse(items);
  if (!bag.success)
    return {
      ok: false,
      error: "Your bag couldn't be read. Try removing and re-adding the pieces.",
    };
  const code = codeSchema.safeParse(couponCode);
  if (code.success && code.data) {
    const rl = await limit("coupon", await clientIp());
    if (!rl.ok) return { ok: false, error: tooMany(rl) };
  }
  const result = await priceBag(
    supabaseCheckoutStore(),
    bag.data,
    code.success ? code.data : undefined,
    new Date(),
  );
  if (!result.ok) return result;
  return {
    ok: true,
    lines: toQuoteLines(result.lines),
    totals: result.totals,
    coupon: result.coupon,
    couponError: code.success ? result.couponError : "That code doesn't look right.",
  };
}

export type CheckoutResult =
  | {
      ok: true;
      orderNumber: string;
      razorpayOrderId: string;
      amountPaise: number;
      keyId: string;
      prefill: { name: string; email: string; contact: string };
    }
  | { ok: false; error: string; fields?: Record<string, string>; variantId?: string };

/**
 * Creates the order (status: awaiting payment) and its Razorpay order, both
 * from database prices. The browser then opens Razorpay's own window.
 */
export async function createCheckout(input: unknown): Promise<CheckoutResult> {
  if (!accountsEnabled()) return { ok: false, error: UNAVAILABLE };
  const keys = razorpayKeys();
  if (!keys)
    return { ok: false, error: "Payments aren't switched on yet (Razorpay keys are missing)." };

  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: "Check the highlighted fields.", fields: fieldErrors(parsed.error) };

  const rl = await limit("checkout", await clientIp());
  if (!rl.ok) return { ok: false, error: tooMany(rl) };

  const { email, phone, address, couponCode, items } = parsed.data;
  const priced = await priceBag(supabaseCheckoutStore(), items, couponCode, new Date());
  if (!priced.ok) return priced;
  if (priced.couponError)
    return { ok: false, error: priced.couponError, fields: { couponCode: priced.couponError } };

  const user = await getUser();
  const db = createAdminClient();
  const { data: order, error } = await db
    .from("orders")
    .insert({
      user_id: user?.id ?? null,
      email,
      phone,
      subtotal_paise: priced.totals.subtotal,
      discount_paise: priced.totals.discount,
      shipping_paise: priced.totals.shipping,
      total_paise: priced.totals.total,
      coupon_code: priced.coupon?.code ?? null,
      shipping_address: { ...address, phone },
    })
    .select("id, number")
    .single();
  if (error || !order) {
    console.error("[checkout] order insert:", error?.message);
    return { ok: false, error: "We couldn't start your order. Please try again." };
  }

  const { error: itemsError } = await db.from("order_items").insert(
    priced.lines.map((l) => ({
      order_id: order.id,
      product_id: l.productId,
      variant_id: l.variantId,
      product_name: l.name,
      product_slug: l.slug,
      size: l.size,
      colour: l.colour,
      image_path: l.imagePath,
      unit_price_paise: l.unitPaise,
      qty: l.qty,
    })),
  );

  let razorpayOrderId: string | null = null;
  if (!itemsError) {
    try {
      razorpayOrderId = await createRazorpayOrder(priced.totals.total, order.number, {
        order_number: order.number,
      });
    } catch (err) {
      console.error("[checkout] razorpay:", err instanceof Error ? err.message : err);
    }
  }
  if (itemsError || !razorpayOrderId) {
    if (itemsError) console.error("[checkout] items insert:", itemsError.message);
    await db.from("orders").delete().eq("id", order.id);
    return {
      ok: false,
      error: "We couldn't reach the payment service. Please try again in a minute.",
    };
  }

  await db.from("orders").update({ razorpay_order_id: razorpayOrderId }).eq("id", order.id);

  return {
    ok: true,
    orderNumber: order.number,
    razorpayOrderId,
    amountPaise: priced.totals.total,
    keyId: keys.keyId,
    prefill: { name: address.name, email, contact: phone },
  };
}

const paymentSchema = z.object({
  razorpayOrderId: z.string().regex(/^order_[A-Za-z0-9]{6,40}$/),
  razorpayPaymentId: z.string().regex(/^pay_[A-Za-z0-9]{6,40}$/),
  signature: z.string().regex(/^[a-f0-9]{64}$/),
});

/** Razorpay's window reports success. Accepted only if the signature checks out. */
export async function confirmPayment(
  input: unknown,
): Promise<{ ok: true; orderNumber: string; outOfStock: boolean } | { ok: false; error: string }> {
  const keys = razorpayKeys();
  const parsed = paymentSchema.safeParse(input);
  if (!keys || !parsed.success) return { ok: false, error: "We couldn't confirm that payment." };
  const { razorpayOrderId, razorpayPaymentId, signature } = parsed.data;
  if (!verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, signature, keys.secret)) {
    return { ok: false, error: "We couldn't confirm that payment." };
  }
  try {
    const r = await completePayment(razorpayOrderId, razorpayPaymentId);
    if (r.outcome === "not_found" || !r.orderNumber)
      return { ok: false, error: "We couldn't find that order." };
    return { ok: true, orderNumber: r.orderNumber, outOfStock: r.outcome === "paid_out_of_stock" };
  } catch (err) {
    console.error("[checkout] confirm:", err instanceof Error ? err.message : err);
    return {
      ok: false,
      error:
        "Your payment went through but we couldn't update the order yet. Don't pay again: it will update shortly.",
    };
  }
}

export type SavedAddress = {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

/** For signed-in shoppers: their email, phone and saved addresses, to fill checkout in. */
export async function loadCheckoutProfile(): Promise<{
  email: string;
  phone: string;
  addresses: SavedAddress[];
} | null> {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createServerClient();
  const [{ data: profile }, { data: addresses }] = await Promise.all([
    supabase.from("profiles").select("phone").eq("id", user.id).maybeSingle(),
    supabase
      .from("addresses")
      .select("id, name, phone, line1, line2, city, state, pincode, is_default")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .limit(10),
  ]);
  return { email: user.email, phone: profile?.phone ?? "", addresses: addresses ?? [] };
}

export type TrackState =
  | { status: "idle" | "error"; message: string; values?: { email: string; orderNumber: string } }
  | {
      status: "found";
      message: string;
      order: {
        number: string;
        status: OrderStatus;
        statusLabel: string;
        placedAt: string;
        events: { status: OrderStatus; at: string }[];
        items: { name: string; size: string; colour: string; qty: number }[];
      };
    };

/** Order tracking for anyone with the order number and its email. Same answer for "no such order" and "wrong email". */
export async function trackOrder(_prev: TrackState, form: FormData): Promise<TrackState> {
  if (!accountsEnabled()) return { status: "error", message: UNAVAILABLE };
  const values = {
    email: String(form.get("email") ?? "").slice(0, 254),
    orderNumber: String(form.get("orderNumber") ?? "").slice(0, 40),
  };
  const parsed = trackSchema.safeParse(values);
  if (!parsed.success) {
    const f = fieldErrors(parsed.error);
    return { status: "error", message: f.orderNumber ?? f.email ?? "Check both fields.", values };
  }
  const rl = await limit("track", await clientIp());
  if (!rl.ok) return { status: "error", message: tooMany(rl), values };

  const db = createAdminClient();
  const { data: order } = await db
    .from("orders")
    .select(
      "number, status, created_at, events:order_events ( status, created_at ), items:order_items ( product_name, size, colour, qty )",
    )
    .eq("number", parsed.data.orderNumber)
    .eq("email", parsed.data.email)
    .neq("status", "pending_payment")
    .maybeSingle();
  if (!order) {
    return {
      status: "error",
      message: "We couldn't find an order with that number and email.",
      values,
    };
  }
  return {
    status: "found",
    message: "",
    order: {
      number: order.number,
      status: order.status,
      statusLabel: ORDER_STATUS_LABEL[order.status],
      placedAt: order.created_at,
      events: (order.events ?? []).map((e) => ({ status: e.status, at: e.created_at })),
      items: (order.items ?? []).map((i) => ({
        name: i.product_name,
        size: i.size,
        colour: i.colour,
        qty: i.qty,
      })),
    },
  };
}
