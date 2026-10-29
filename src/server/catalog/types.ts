import type { CollectionInfo } from "@/lib/collections";

/** Shapes the pages work with. Both data sources (Supabase, fixtures) return exactly these. */

export type CollectionSlug = CollectionInfo["slug"];

export interface ProductImage {
  /** path inside the "products" storage bucket, e.g. "static-heavy-tee/1.avif" */
  path: string;
  alt: string;
}

export interface ProductCardData {
  slug: string;
  name: string;
  collection: CollectionSlug;
  pricePaise: number;
  compareAtPaise: number | null;
  images: ProductImage[];
  /** all sizes and colours together */
  totalStock: number;
  /** slug of the drop this product belongs to, if any */
  dropSlug: string | null;
}

export interface VariantData {
  id: string;
  size: string;
  colour: string;
  stock: number;
}

export interface LookPiece {
  product: ProductCardData;
  variants: VariantData[];
}

export interface DropData {
  slug: string;
  name: string;
  description: string;
  /** ISO date-time */
  startsAt: string;
  endsAt: string | null;
  products: ProductCardData[];
}

export interface ReviewSnippet {
  id: string;
  productSlug: string;
  productName: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  isSample: boolean;
  isVerified: boolean;
}

export interface HomeData {
  newIn: ProductCardData[];
  drop: DropData | null;
  /** "Complete the Look": a featured piece and what goes with it */
  look: LookPiece[];
  reviews: ReviewSnippet[];
}

export interface CatalogSource {
  getHomeData(): Promise<HomeData>;
}
