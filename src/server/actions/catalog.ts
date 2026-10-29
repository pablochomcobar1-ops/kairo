"use server";

import { getProduct } from "@/server/catalog";
import type { ProductDetail } from "@/server/catalog/types";

export type QuickViewData = Pick<
  ProductDetail,
  | "slug"
  | "name"
  | "collection"
  | "pricePaise"
  | "compareAtPaise"
  | "images"
  | "variants"
  | "drop"
  | "description"
  | "rating"
>;

/**
 * What quick view needs for one product. Read-only public catalog data (the
 * same as the product page shows); the slug is checked inside getProduct.
 */
export async function loadQuickView(slug: unknown): Promise<QuickViewData | null> {
  if (typeof slug !== "string") return null;
  const p = await getProduct(slug);
  if (!p) return null;
  return {
    slug: p.slug,
    name: p.name,
    collection: p.collection,
    pricePaise: p.pricePaise,
    compareAtPaise: p.compareAtPaise,
    images: p.images,
    variants: p.variants,
    drop: p.drop,
    description: p.description,
    rating: p.rating,
  };
}
