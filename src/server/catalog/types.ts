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

/** A product as the shop grid and search need it (cards plus what filters look at). */
export interface CatalogProduct extends ProductCardData {
  /** ISO date, for "newest" */
  createdAt: string;
  variants: VariantData[];
  /** lower-case name, collection, fabric, colours and description, for search */
  searchText: string;
}

export interface ReviewData extends ReviewSnippet {
  /** ISO date */
  createdAt: string;
}

export interface ProductDetail extends ProductCardData {
  description: string;
  fabric: string;
  fit: string;
  care: string;
  variants: VariantData[];
  drop: { slug: string; name: string; startsAt: string } | null;
  /** this piece first, then what it is styled with */
  look: LookPiece[];
  /** one piece from another collection */
  anotherWay: ProductCardData | null;
  reviews: ReviewData[];
  rating: { average: number; count: number };
}

export interface CatalogSource {
  getHomeData(): Promise<HomeData>;
  /** every published product */
  getCatalog(): Promise<CatalogProduct[]>;
  getProduct(slug: string): Promise<ProductDetail | null>;
}
