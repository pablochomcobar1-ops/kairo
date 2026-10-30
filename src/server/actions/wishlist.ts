"use server";

import { z } from "zod";
import { accountsEnabled } from "@/server/auth";
import { createServerClient } from "@/server/supabase/server";

const slugs = z
  .array(
    z
      .string()
      .max(120)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  )
  .max(100);

type Result = { signedIn: boolean; slugs: string[] };

/**
 * Merge this browser's saved pieces into the account and return the full list
 * (account + browser). Guests get { signedIn: false } and keep their local list.
 * Row Level Security makes sure a shopper only ever touches their own rows.
 */
export async function syncWishlist(local: unknown): Promise<Result> {
  if (!accountsEnabled()) return { signedIn: false, slugs: [] };
  const parsed = slugs.safeParse(local);
  const incoming = parsed.success ? parsed.data : [];

  const supabase = await createServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { signedIn: false, slugs: [] };
  const userId = auth.user.id;

  if (incoming.length > 0) {
    const { data: products } = await supabase.from("products").select("id").in("slug", incoming);
    if (products?.length) {
      await supabase.from("wishlist_items").upsert(
        products.map((p) => ({ user_id: userId, product_id: p.id })),
        { onConflict: "user_id,product_id", ignoreDuplicates: true },
      );
    }
  }

  const { data: rows, error } = await supabase
    .from("wishlist_items")
    .select("created_at, product:products!inner ( slug )")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    console.error("[wishlist] read:", error.message);
    return { signedIn: true, slugs: incoming };
  }
  return {
    signedIn: true,
    slugs: rows.map((r) => (r.product as unknown as { slug: string }).slug),
  };
}

/** Save or unsave one piece on the account. No-op for guests (their list stays in the browser). */
export async function setWishlisted(slug: unknown, saved: unknown): Promise<{ ok: boolean }> {
  if (!accountsEnabled() || typeof saved !== "boolean") return { ok: false };
  const parsed = z
    .string()
    .max(120)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    .safeParse(slug);
  if (!parsed.success) return { ok: false };

  const supabase = await createServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { ok: false };

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("slug", parsed.data)
    .maybeSingle();
  if (!product) return { ok: false };

  const { error } = saved
    ? await supabase
        .from("wishlist_items")
        .upsert(
          { user_id: auth.user.id, product_id: product.id },
          { onConflict: "user_id,product_id", ignoreDuplicates: true },
        )
    : await supabase
        .from("wishlist_items")
        .delete()
        .eq("user_id", auth.user.id)
        .eq("product_id", product.id);
  if (error) console.error("[wishlist] write:", error.message);
  return { ok: !error };
}
