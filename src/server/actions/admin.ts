"use server";

import { refresh, updateTag } from "next/cache";
import {
  ABANDONED_AFTER_HOURS,
  canCancel,
  NEXT_STATUS,
  parseStock,
  productEditSchema,
} from "@/lib/admin";
import type { OrderStatus } from "@/lib/orders";
import { fieldErrors } from "@/lib/validation";
import { getUser } from "@/server/auth";
import { CATALOG_TAG } from "@/server/catalog";
import { orderShippedEmail, sendEmail } from "@/server/email";
import { createServerClient } from "@/server/supabase/server";

/**
 * Admin actions. Every one checks again, on the server, that the caller is an
 * admin (pages are not the only way to reach an action), and the database's
 * own rules check a third time. They all use the admin's session, never the
 * secret key.
 */

export type AdminState = {
  status: "idle" | "ok" | "error";
  message: string;
  fields?: Record<string, string>;
};

const NOT_ADMIN: AdminState = { status: "error", message: "Only an admin can do that." };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const str = (f: FormData, k: string) => (typeof f.get(k) === "string" ? String(f.get(k)) : "");

async function asAdmin() {
  const user = await getUser();
  if (user?.role !== "admin") return null;
  return { user, db: await createServerClient() };
}

function failed(what: string, err: unknown): AdminState {
  console.error(`[admin] ${what}:`, err instanceof Error ? err.message : err);
  return { status: "error", message: `Couldn't ${what}. Please try again.` };
}

// ---------------------------------------------------------------- orders

export async function advanceOrder(_prev: AdminState, form: FormData): Promise<AdminState> {
  const a = await asAdmin();
  if (!a) return NOT_ADMIN;
  const id = str(form, "orderId");
  const from = str(form, "from") as OrderStatus;
  const to = NEXT_STATUS[from];
  if (!UUID.test(id) || !to) return { status: "error", message: "That step isn't possible." };

  // only if it is still where the page showed it, so two tabs can't skip a step
  const { data, error } = await a.db
    .from("orders")
    .update({ status: to })
    .eq("id", id)
    .eq("status", from)
    .select("number, email, shipping_address")
    .maybeSingle();
  if (error) return failed("update the order", error.message);
  if (!data) {
    refresh();
    return {
      status: "error",
      message: "The order changed in the meantime. The page is up to date now.",
    };
  }
  if (to === "shipped") {
    const name = (data.shipping_address as { name?: string } | null)?.name ?? "";
    await sendEmail(orderShippedEmail({ number: data.number, email: data.email, name }));
  }
  refresh();
  return { status: "ok", message: `Marked ${to}.` };
}

export async function cancelOrder(_prev: AdminState, form: FormData): Promise<AdminState> {
  const a = await asAdmin();
  if (!a) return NOT_ADMIN;
  const id = str(form, "orderId");
  const status = str(form, "status") as OrderStatus;
  const note = str(form, "note").trim().slice(0, 300);
  if (!UUID.test(id) || !canCancel(status))
    return { status: "error", message: "This order can't be cancelled." };
  if (note.length < 3)
    return {
      status: "error",
      message: "Add a short reason.",
      fields: { note: "Add a short reason." },
    };

  const { data, error } = await a.db.rpc("admin_cancel_order", { p_order_id: id, p_note: note });
  if (error) return failed("cancel the order", error.message);
  refresh();
  if (data !== "cancelled")
    return { status: "error", message: "This order can no longer be cancelled." };
  updateTag(CATALOG_TAG); // stock went back on the shelf
  return { status: "ok", message: "Cancelled. Stock is back and the refund is marked as due." };
}

export async function markRefunded(_prev: AdminState, form: FormData): Promise<AdminState> {
  const a = await asAdmin();
  if (!a) return NOT_ADMIN;
  const id = str(form, "orderId");
  if (!UUID.test(id)) return { status: "error", message: "Unknown order." };
  const { data, error } = await a.db.rpc("admin_mark_refunded", { p_order_id: id });
  if (error) return failed("record the refund", error.message);
  refresh();
  return data === "refunded"
    ? { status: "ok", message: "Refund recorded." }
    : { status: "error", message: "No refund was due on this order." };
}

export async function clearAbandoned(): Promise<AdminState> {
  const a = await asAdmin();
  if (!a) return NOT_ADMIN;
  const { data, error } = await a.db.rpc("admin_clear_abandoned", {
    p_hours: ABANDONED_AFTER_HOURS,
  });
  if (error) return failed("clear old checkouts", error.message);
  refresh();
  const n = data ?? 0;
  return {
    status: "ok",
    message: n === 0 ? "Nothing to clear." : `Cleared ${n} unpaid checkout${n === 1 ? "" : "s"}.`,
  };
}

// ---------------------------------------------------------------- products

export async function saveProduct(_prev: AdminState, form: FormData): Promise<AdminState> {
  const a = await asAdmin();
  if (!a) return NOT_ADMIN;
  const id = str(form, "productId");
  if (!UUID.test(id)) return { status: "error", message: "Unknown product." };

  const parsed = productEditSchema.safeParse({
    name: str(form, "name"),
    price: str(form, "price"),
    compareAt: str(form, "compareAt"),
    published: form.get("published"),
    description: str(form, "description"),
    fabric: str(form, "fabric"),
    fit: str(form, "fit"),
    care: str(form, "care"),
  });
  const stock = parseStock(form.entries());
  if (!parsed.success || stock.error)
    return {
      status: "error",
      message: stock.error ?? "Check the highlighted fields.",
      fields: parsed.success ? undefined : fieldErrors(parsed.error),
    };

  const p = parsed.data;
  const { error } = await a.db
    .from("products")
    .update({
      name: p.name,
      price_paise: p.price,
      compare_at_paise: p.compareAt,
      is_published: p.published,
      description: p.description,
      fabric: p.fabric,
      fit: p.fit,
      care: p.care,
    })
    .eq("id", id);
  if (error) return failed("save the product", error.message);

  for (const [variantId, n] of stock.stock) {
    // product_id too: a stock field can only ever change this product's sizes
    const r = await a.db
      .from("variants")
      .update({ stock: n })
      .eq("id", variantId)
      .eq("product_id", id);
    if (r.error) return failed("save the stock", r.error.message);
  }

  updateTag(CATALOG_TAG);
  refresh();
  return { status: "ok", message: "Saved. The shop shows the change now." };
}

export async function setPublished(_prev: AdminState, form: FormData): Promise<AdminState> {
  const a = await asAdmin();
  if (!a) return NOT_ADMIN;
  const id = str(form, "productId");
  if (!UUID.test(id)) return { status: "error", message: "Unknown product." };
  const published = str(form, "published") === "true";
  const { error } = await a.db.from("products").update({ is_published: published }).eq("id", id);
  if (error) return failed("change the product", error.message);
  updateTag(CATALOG_TAG);
  refresh();
  return { status: "ok", message: published ? "Shown in the shop." : "Hidden from the shop." };
}

// ---------------------------------------------------------------- reviews

export async function moderateReview(_prev: AdminState, form: FormData): Promise<AdminState> {
  const a = await asAdmin();
  if (!a) return NOT_ADMIN;
  const id = str(form, "reviewId");
  const decision = str(form, "decision");
  if (!UUID.test(id) || !["approved", "rejected", "delete"].includes(decision))
    return { status: "error", message: "Unknown review." };

  if (decision === "delete") {
    const { data, error } = await a.db
      .from("reviews")
      .delete()
      .eq("id", id)
      .select("photo_paths")
      .maybeSingle();
    if (error) return failed("delete the review", error.message);
    if (data?.photo_paths?.length) {
      const r = await a.db.storage.from("reviews").remove(data.photo_paths);
      if (r.error) console.error("[admin] review photos left behind:", r.error.message);
    }
  } else {
    const { error } = await a.db
      .from("reviews")
      .update({ status: decision as "approved" | "rejected" })
      .eq("id", id);
    if (error) return failed("update the review", error.message);
  }
  updateTag(CATALOG_TAG);
  refresh();
  return {
    status: "ok",
    message:
      decision === "approved"
        ? "Approved: it's on the product page."
        : decision === "rejected"
          ? "Rejected."
          : "Deleted.",
  };
}

// ---------------------------------------------------------------- messages

export async function setMessageHandled(_prev: AdminState, form: FormData): Promise<AdminState> {
  const a = await asAdmin();
  if (!a) return NOT_ADMIN;
  const id = str(form, "messageId");
  if (!UUID.test(id)) return { status: "error", message: "Unknown message." };
  const handled = str(form, "handled") === "true";
  const { error } = await a.db
    .from("contact_messages")
    .update({ is_handled: handled })
    .eq("id", id);
  if (error) return failed("update the message", error.message);
  refresh();
  return { status: "ok", message: handled ? "Marked handled." : "Marked open." };
}
