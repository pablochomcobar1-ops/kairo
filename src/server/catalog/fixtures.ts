import "server-only";
import * as catalog from "../../../supabase/seed/catalog.mjs";
import { FEATURED_LOOK_SLUG } from "./featured";
import { buildSearchText } from "./search-text";
import type {
  CatalogProduct,
  CatalogSource,
  CollectionSlug,
  HomeData,
  ProductCardData,
  ProductDetail,
  ReviewData,
  VariantData,
} from "./types";

/**
 * The catalog straight from supabase/seed/catalog.mjs, with no database.
 * Used only when KAIRO_DATA=fixtures: the automatic GitHub checks (which have
 * no keys) and offline previews. Same products and copy as the real seed;
 * stock levels are made up but fixed, with a few sizes sold out.
 */

type SeedProduct = (typeof catalog.products)[number];

const rupees = (n: number) => Math.round(n * 100);

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function variantsOf(p: SeedProduct): VariantData[] {
  return p.colours.flatMap((colour) =>
    p.sizes.map((size) => {
      const h = hash(`${p.slug}|${colour}|${size}`);
      return {
        id: `fixture-${p.slug}-${colour}-${size}`.toLowerCase().replace(/\s+/g, "-"),
        size,
        colour,
        stock: h % 7 === 0 ? 0 : 2 + (h % 15),
      };
    }),
  );
}

// a fixed "created" date per product, newest first in catalog order per collection
const BASE = Date.UTC(2026, 9, 20);
const createdAt = (i: number) => new Date(BASE - i * 3_600_000).toISOString();

function card(p: SeedProduct): ProductCardData {
  return {
    slug: p.slug,
    name: p.name,
    collection: p.collection as CollectionSlug,
    pricePaise: rupees(p.price),
    compareAtPaise: p.compareAt ? rupees(p.compareAt) : null,
    images: [
      { path: `${p.slug}/1.avif`, alt: `${p.name} in ${p.colours[0]}, front view` },
      { path: `${p.slug}/2.avif`, alt: `${p.name}, fabric and detail close-up` },
    ],
    totalStock: variantsOf(p).reduce((n, v) => n + v.stock, 0),
    dropSlug: p.drop ?? null,
  };
}

const bySlug = new Map(catalog.products.map((p) => [p.slug, p]));
const piece = (p: SeedProduct) => ({ product: card(p), variants: variantsOf(p) });
const known = (slugs: string[]) =>
  slugs.map((s) => bySlug.get(s)).filter((p): p is SeedProduct => Boolean(p));

function dropStart() {
  const drop = catalog.drops[0];
  // N days from now at 8:00 pm India time (14:30 UTC)
  const d = new Date(Date.now() + drop.startsInDays * 86_400_000);
  d.setUTCHours(14, 30, 0, 0);
  return d.toISOString();
}

function reviewsFor(p: SeedProduct, index: number): ReviewData[] {
  const pool = catalog.sampleReviewText[p.collection as keyof typeof catalog.sampleReviewText];
  const count = 3 + (hash(p.slug) % 2);
  return Array.from({ length: count }, (_, i) => {
    const r = pool[(index + i) % pool.length];
    return {
      id: `fixture-review-${p.slug}-${i}`,
      productSlug: p.slug,
      productName: p.name,
      author: catalog.sampleReviewers[(index * 3 + i) % catalog.sampleReviewers.length],
      rating: r.rating,
      title: r.title,
      body: r.body,
      isSample: true,
      isVerified: false,
      createdAt: new Date(BASE - (i + 1) * 9 * 86_400_000).toISOString(),
    };
  });
}

export const fixturesSource: CatalogSource = {
  async getHomeData(): Promise<HomeData> {
    const drop = catalog.drops[0];
    return {
      newIn: [...catalog.products]
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 8)
        .map(card),
      drop: {
        slug: drop.slug,
        name: drop.name,
        description: drop.description,
        startsAt: dropStart(),
        endsAt: null,
        products: catalog.products.filter((p) => p.drop === drop.slug).map(card),
      },
      look: known([
        FEATURED_LOOK_SLUG,
        ...(catalog.looks[FEATURED_LOOK_SLUG as keyof typeof catalog.looks] ?? []),
      ]).map(piece),
      reviews: catalog.products.slice(0, 10).map((p, i) => {
        const r = reviewsFor(p, i)[0];
        return {
          id: r.id,
          productSlug: r.productSlug,
          productName: r.productName,
          author: r.author,
          rating: r.rating,
          title: r.title,
          body: r.body,
          isSample: r.isSample,
          isVerified: r.isVerified,
        };
      }),
    };
  },

  async getCatalog(): Promise<CatalogProduct[]> {
    return catalog.products.map((p, i) => ({
      ...card(p),
      createdAt: createdAt(i % 8),
      variants: variantsOf(p),
      searchText: buildSearchText({
        name: p.name,
        collection: p.collection,
        fabric: p.fabric,
        description: p.description,
        colours: p.colours,
      }),
    }));
  },

  async getProduct(slug: string): Promise<ProductDetail | null> {
    const p = bySlug.get(slug);
    if (!p) return null;
    const index = catalog.products.indexOf(p);
    const reviews = reviewsFor(p, index);
    const other = catalog.anotherWay[slug as keyof typeof catalog.anotherWay];
    const drop = p.drop ? catalog.drops.find((d) => d.slug === p.drop) : undefined;
    return {
      ...card(p),
      description: p.description,
      fabric: p.fabric,
      fit: p.fit,
      care: p.care,
      variants: variantsOf(p),
      drop: drop ? { slug: drop.slug, name: drop.name, startsAt: dropStart() } : null,
      look: known([slug, ...(catalog.looks[slug as keyof typeof catalog.looks] ?? [])]).map(piece),
      anotherWay: other && bySlug.get(other) ? card(bySlug.get(other)!) : null,
      reviews,
      rating: {
        average: Math.round((reviews.reduce((n, r) => n + r.rating, 0) / reviews.length) * 10) / 10,
        count: reviews.length,
      },
    };
  },
};
