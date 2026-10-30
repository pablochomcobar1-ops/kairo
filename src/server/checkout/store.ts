import "server-only";
import type { Coupon } from "@/lib/coupons";
import { createAdminClient } from "@/server/supabase/admin";
import type { CheckoutStore, StoredVariant } from "./core";

/**
 * The checkout store backed by Supabase. Uses the server key (coupons and
 * exact stock are not readable by shoppers), so every row is checked here:
 * unpublished products are reported as unpublished, never sold.
 */
export function supabaseCheckoutStore(): CheckoutStore {
  const db = createAdminClient();
  return {
    async variants(ids) {
      if (ids.length === 0) return [];
      const { data, error } = await db
        .from("variants")
        .select(
          "id, size, colour, stock, product:products!inner ( id, slug, name, price_paise, is_published, images:product_images ( path, position ), drop:drops ( name, starts_at ) )",
        )
        .in("id", ids);
      if (error) throw new Error(`Checkout: could not load variants: ${error.message}`);
      type Row = {
        id: string;
        size: string;
        colour: string;
        stock: number;
        product: {
          id: string;
          slug: string;
          name: string;
          price_paise: number;
          is_published: boolean;
          images: { path: string; position: number }[] | null;
          drop: { name: string; starts_at: string } | null;
        };
      };
      return (data as unknown as Row[]).map((r): StoredVariant => ({
        id: r.id,
        size: r.size,
        colour: r.colour,
        stock: r.stock,
        product: {
          id: r.product.id,
          slug: r.product.slug,
          name: r.product.name,
          pricePaise: r.product.price_paise,
          published: r.product.is_published,
          imagePath:
            [...(r.product.images ?? [])].sort((a, b) => a.position - b.position)[0]?.path ?? null,
          drop: r.product.drop
            ? { name: r.product.drop.name, startsAt: r.product.drop.starts_at }
            : null,
        },
      }));
    },
    async coupon(code) {
      const { data, error } = await db
        .from("coupons")
        .select(
          "code, kind, value, min_subtotal_paise, starts_at, ends_at, max_uses, used_count, is_active",
        )
        .eq("code", code)
        .maybeSingle();
      if (error) throw new Error(`Checkout: could not load coupon: ${error.message}`);
      return (data as Coupon | null) ?? null;
    },
  };
}
