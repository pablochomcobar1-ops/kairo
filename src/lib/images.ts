/**
 * Product photos live in the Supabase "products" bucket. Until the AI shoot
 * (Task 13) uploads them, NEXT_PUBLIC_PRODUCT_PHOTOS stays off and every card
 * draws its garment art instead, so there are never broken images.
 */
export function productImageUrl(path: string | null | undefined): string | null {
  if (!path || process.env.NEXT_PUBLIC_PRODUCT_PHOTOS !== "1") return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/products/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export type GarmentKind =
  "jacket" | "hoodie" | "shirt" | "knit" | "tee" | "trouser" | "tie" | "gloves";

/** Which silhouette to draw for a product, from its name. */
export function garmentKind(name: string): GarmentKind {
  const n = name.toLowerCase();
  if (/glove/.test(n)) return "gloves";
  if (/\btie\b/.test(n)) return "tie";
  if (/hoodie/.test(n)) return "hoodie";
  if (/trouser|cargo|jean|pant|denim|chino/.test(n)) return "trouser";
  if (/jacket|blazer|coat|suit|shell/.test(n)) return "jacket";
  if (/sweater|turtleneck|knit|base layer/.test(n)) return "knit";
  if (/shirt|polo|rugby/.test(n)) return "shirt";
  return "tee";
}
