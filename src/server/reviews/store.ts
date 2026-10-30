import "server-only";
import { createAdminClient } from "@/server/supabase/admin";
import type { PhotoKind, ReviewStore } from "./core";

const TYPES: Record<PhotoKind, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * Reviews in Supabase. Shoppers can't write to the reviews table or the
 * private "reviews" photo bucket themselves; the server writes with the
 * secret key after core.ts has checked everything.
 */
export function supabaseReviewStore(): ReviewStore {
  const db = createAdminClient();
  return {
    async productId(slug) {
      const { data, error } = await db
        .from("products")
        .select("id")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      if (error) throw new Error(`Reviews: product lookup failed: ${error.message}`);
      return data?.id ?? null;
    },
    async isVerifiedBuyer(userId, productId) {
      const { data, error } = await db.rpc("is_verified_buyer", {
        p_user_id: userId,
        p_product_id: productId,
      });
      if (error) throw new Error(`Reviews: verified check failed: ${error.message}`);
      return data === true;
    },
    async hasReviewed(userId, productId) {
      const { count, error } = await db
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("product_id", productId);
      if (error) throw new Error(`Reviews: duplicate check failed: ${error.message}`);
      return (count ?? 0) > 0;
    },
    async insert(row) {
      const { error } = await db
        .from("reviews")
        .insert({ ...row, status: "pending", is_sample: false });
      if (error) throw new Error(`Reviews: insert failed: ${error.message}`);
    },
    async uploadPhotos(reviewId, photos) {
      const paths: string[] = [];
      for (const [i, p] of photos.entries()) {
        const path = `${reviewId}/${i + 1}.${p.kind}`;
        const { error } = await db.storage
          .from("reviews")
          .upload(path, p.bytes, { contentType: TYPES[p.kind], upsert: false });
        if (error) {
          if (paths.length) await db.storage.from("reviews").remove(paths);
          throw new Error(`Reviews: photo upload failed: ${error.message}`);
        }
        paths.push(path);
      }
      return paths;
    },
    async removePhotos(paths) {
      await db.storage.from("reviews").remove(paths);
    },
  };
}

/** Signed links (7 days) for approved reviews' photos; the bucket itself stays private. */
export async function signedReviewPhotos(paths: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (paths.length === 0) return out;
  const { data, error } = await createAdminClient()
    .storage.from("reviews")
    .createSignedUrls(paths, 60 * 60 * 24 * 7);
  if (error) {
    console.error("[reviews] could not sign photo links:", error.message);
    return out;
  }
  for (const d of data ?? []) if (d.path && d.signedUrl) out.set(d.path, d.signedUrl);
  return out;
}
