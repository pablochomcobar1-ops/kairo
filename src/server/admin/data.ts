import "server-only";
import { redirect } from "next/navigation";
import {
  ABANDONED_AFTER_HOURS,
  LOW_STOCK,
  type AdminOrderFilter,
  type ReviewFilter,
} from "@/lib/admin";
import type { OrderStatus } from "@/lib/orders";
import { getUser, type SessionUser } from "@/server/auth";
import { createServerClient } from "@/server/supabase/server";
import type { Database } from "@/types/db";

/**
 * Everything the admin pages read. Reads use the admin's own session, so the
 * database's Row Level Security applies too: even if a page forgot to check,
 * a non-admin would get nothing back.
 */

type PaymentStatus = Database["public"]["Enums"]["payment_status"];

/** Pages: an admin, or off to sign in / home. (The proxy checks first; this is the second check.) */
export async function requireAdmin(next = "/admin"): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  if (user.role !== "admin") redirect("/");
  return user;
}

function fail(what: string, error: { message: string }): never {
  throw new Error(`Admin: could not load ${what}: ${error.message}`);
}

export interface Address {
  name?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
}

export interface OrderRow {
  id: string;
  number: string;
  email: string;
  name: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalPaise: number;
  createdAt: string;
}

const ORDER_ROW =
  "id, number, email, status, payment_status, total_paise, created_at, shipping_address";

type RawOrder = {
  id: string;
  number: string;
  email: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_paise: number;
  created_at: string;
  shipping_address: unknown;
};
const toOrderRow = (o: RawOrder): OrderRow => ({
  id: o.id,
  number: o.number,
  email: o.email,
  name: ((o.shipping_address ?? {}) as Address).name ?? "",
  status: o.status,
  paymentStatus: o.payment_status,
  totalPaise: o.total_paise,
  createdAt: o.created_at,
});

export async function getOverview() {
  const db = await createServerClient();
  const cutoff = new Date(Date.now() - ABANDONED_AFTER_HOURS * 3600_000).toISOString();
  const [orders, recent, reviews, messages, lowStock, abandoned] = await Promise.all([
    db
      .from("orders")
      .select("status, payment_status, total_paise")
      .neq("status", "pending_payment")
      .limit(5000),
    db
      .from("orders")
      .select(ORDER_ROW)
      .neq("status", "pending_payment")
      .order("created_at", { ascending: false })
      .limit(6),
    db.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("is_handled", false),
    db
      .from("variants")
      .select("id, size, colour, stock, product:products!inner ( slug, name )")
      .lte("stock", LOW_STOCK)
      .order("stock")
      .limit(12),
    db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_payment")
      .is("razorpay_payment_id", null)
      .lt("created_at", cutoff),
  ]);
  for (const [what, r] of [
    ["orders", orders],
    ["recent orders", recent],
    ["reviews", reviews],
    ["messages", messages],
    ["stock", lowStock],
    ["abandoned checkouts", abandoned],
  ] as const)
    if (r.error) fail(what, r.error);

  const rows = orders.data ?? [];
  const revenue = rows
    .filter((o) => o.payment_status === "paid")
    .reduce((n, o) => n + o.total_paise, 0);
  const toShip = rows.filter((o) => o.status === "placed" || o.status === "packed").length;
  const refundsDue = rows.filter((o) => o.payment_status === "refund_due").length;

  return {
    paidOrders: rows.filter((o) => o.payment_status === "paid").length,
    revenue,
    toShip,
    refundsDue,
    pendingReviews: reviews.count ?? 0,
    openMessages: messages.count ?? 0,
    abandoned: abandoned.count ?? 0,
    recent: ((recent.data ?? []) as RawOrder[]).map(toOrderRow),
    lowStock: (
      (lowStock.data ?? []) as unknown as {
        id: string;
        size: string;
        colour: string;
        stock: number;
        product: { slug: string; name: string };
      }[]
    ).map((v) => ({ ...v, slug: v.product.slug, name: v.product.name })),
  };
}

export async function getOrders(filter: AdminOrderFilter, q: string): Promise<OrderRow[]> {
  const db = await createServerClient();
  let query = db
    .from("orders")
    .select(ORDER_ROW)
    .order("created_at", { ascending: false })
    .limit(100);
  if (filter === "refund_due") query = query.eq("payment_status", "refund_due");
  else if (filter !== "all") query = query.eq("status", filter);
  else query = query.neq("status", "pending_payment");
  // q is cleaned by cleanSearch (letters, digits, @ . - and spaces only)
  if (q) query = query.or(`number.ilike.%${q}%,email.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) fail("orders", error);
  return ((data ?? []) as RawOrder[]).map(toOrderRow);
}

export async function getOrder(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = await createServerClient();
  const { data, error } = await db
    .from("orders")
    .select(
      "id, number, email, phone, user_id, status, payment_status, subtotal_paise, discount_paise, shipping_paise, total_paise, coupon_code, razorpay_order_id, razorpay_payment_id, shipping_address, paid_at, created_at, items:order_items ( id, product_name, product_slug, size, colour, unit_price_paise, qty ), events:order_events ( id, status, note, created_at )",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) fail("order", error);
  if (!data) return null;
  return {
    ...data,
    address: (data.shipping_address ?? {}) as Address,
    events: [...(data.events ?? [])].sort((a, b) => a.id - b.id),
  };
}
export type AdminOrder = NonNullable<Awaited<ReturnType<typeof getOrder>>>;

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  collection: string;
  pricePaise: number;
  compareAtPaise: number | null;
  published: boolean;
  stock: number;
  lowSizes: number;
}

export async function getProducts(q: string): Promise<ProductRow[]> {
  const db = await createServerClient();
  let query = db
    .from("products")
    .select(
      "id, slug, name, price_paise, compare_at_paise, is_published, collection:collections!inner ( slug, position ), variants ( stock )",
    )
    .order("name");
  if (q) query = query.ilike("name", `%${q}%`);
  const { data, error } = await query;
  if (error) fail("products", error);
  type Row = {
    id: string;
    slug: string;
    name: string;
    price_paise: number;
    compare_at_paise: number | null;
    is_published: boolean;
    collection: { slug: string; position: number };
    variants: { stock: number }[];
  };
  return ((data ?? []) as unknown as Row[])
    .sort((a, b) => a.collection.position - b.collection.position || a.name.localeCompare(b.name))
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      collection: p.collection.slug,
      pricePaise: p.price_paise,
      compareAtPaise: p.compare_at_paise,
      published: p.is_published,
      stock: p.variants.reduce((n, v) => n + v.stock, 0),
      lowSizes: p.variants.filter((v) => v.stock <= LOW_STOCK).length,
    }));
}

export async function getProductForEdit(slug: string) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 120) return null;
  const db = await createServerClient();
  const { data, error } = await db
    .from("products")
    .select(
      "id, slug, name, description, fabric, fit, care, price_paise, compare_at_paise, is_published, updated_at, collection:collections!inner ( slug, name ), variants ( id, size, colour, sku, stock, position )",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (error) fail("product", error);
  if (!data) return null;
  const row = data as unknown as typeof data & {
    collection: { slug: string; name: string };
    variants: {
      id: string;
      size: string;
      colour: string;
      sku: string;
      stock: number;
      position: number;
    }[];
  };
  return { ...row, variants: [...row.variants].sort((a, b) => a.position - b.position) };
}
export type AdminProduct = NonNullable<Awaited<ReturnType<typeof getProductForEdit>>>;

export async function getReviews(filter: ReviewFilter) {
  const db = await createServerClient();
  const { data, error } = await db
    .from("reviews")
    .select(
      "id, author_name, rating, title, body, photo_paths, is_sample, is_verified, status, created_at, user_id, product:products ( slug, name )",
    )
    .eq("status", filter)
    .order("created_at", { ascending: filter !== "pending" ? false : true })
    .limit(100);
  if (error) fail("reviews", error);
  const rows = (data ?? []) as unknown as (Omit<NonNullable<typeof data>[number], "product"> & {
    product: { slug: string; name: string } | null;
  })[];

  // private photos: short-lived links, readable because the admin's session passes the bucket's admin policy
  const paths = rows.flatMap((r) => r.photo_paths ?? []);
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data: links } = await db.storage.from("reviews").createSignedUrls(paths, 60 * 30);
    for (const l of links ?? []) if (l.path && l.signedUrl) signed.set(l.path, l.signedUrl);
  }
  return rows.map((r) => ({
    ...r,
    photos: (r.photo_paths ?? []).flatMap((p) => signed.get(p) ?? []),
  }));
}
export type AdminReview = Awaited<ReturnType<typeof getReviews>>[number];

export async function getMessages() {
  const db = await createServerClient();
  const { data, error } = await db
    .from("contact_messages")
    .select("id, name, email, phone, message, is_handled, created_at")
    .order("is_handled")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) fail("messages", error);
  return data ?? [];
}
export type AdminMessage = Awaited<ReturnType<typeof getMessages>>[number];

export async function getCounts() {
  const db = await createServerClient();
  const [reviews, messages] = await Promise.all([
    db.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db
      .from("contact_messages")
      .select("id", { count: "exact", head: true })
      .eq("is_handled", false),
  ]);
  return { reviews: reviews.count ?? 0, messages: messages.count ?? 0 };
}
