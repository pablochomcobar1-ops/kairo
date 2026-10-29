import "server-only";
import * as catalog from "../../../supabase/seed/catalog.mjs";
import { FEATURED_LOOK_SLUG } from "./featured";
import type {
  CatalogSource,
  CollectionSlug,
  HomeData,
  ProductCardData,
  ReviewSnippet,
  VariantData,
} from "./types";

/**
 * The catalog straight from supabase/seed/catalog.mjs, with no database.
 * Used only when KAIRO_DATA=fixtures: the automatic GitHub checks (which have
 * no keys) and offline previews. Same products and copy as the real seed.
 */

type SeedProduct = (typeof catalog.products)[number];

const STOCK_PER_VARIANT = 10;
const rupees = (n: number) => Math.round(n * 100);

function variantsOf(p: SeedProduct): VariantData[] {
  return p.colours.flatMap((colour) =>
    p.sizes.map((size) => ({
      id: `fixture-${p.slug}-${colour}-${size}`.toLowerCase().replace(/\s+/g, "-"),
      size,
      colour,
      stock: STOCK_PER_VARIANT,
    })),
  );
}

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
    totalStock: variantsOf(p).length * STOCK_PER_VARIANT,
    dropSlug: p.drop ?? null,
  };
}

const bySlug = new Map(catalog.products.map((p) => [p.slug, p]));

export const fixturesSource: CatalogSource = {
  async getHomeData(): Promise<HomeData> {
    const drop = catalog.drops[0];
    // N days from now at 8:00 pm India time (14:30 UTC), like the seed
    const startsAt = new Date(Date.now() + drop.startsInDays * 86_400_000);
    startsAt.setUTCHours(14, 30, 0, 0);

    const lookSlugs = [
      FEATURED_LOOK_SLUG,
      ...(catalog.looks[FEATURED_LOOK_SLUG as keyof typeof catalog.looks] ?? []),
    ];

    const reviews: ReviewSnippet[] = catalog.products.slice(0, 10).map((p, i) => {
      const pool = catalog.sampleReviewText[p.collection as keyof typeof catalog.sampleReviewText];
      const r = pool[i % pool.length];
      return {
        id: `fixture-review-${i}`,
        productSlug: p.slug,
        productName: p.name,
        author: catalog.sampleReviewers[i % catalog.sampleReviewers.length],
        rating: r.rating,
        title: r.title,
        body: r.body,
        isSample: true,
        isVerified: false,
      };
    });

    return {
      newIn: [...catalog.products]
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, 8)
        .map(card),
      drop: {
        slug: drop.slug,
        name: drop.name,
        description: drop.description,
        startsAt: startsAt.toISOString(),
        endsAt: null,
        products: catalog.products.filter((p) => p.drop === drop.slug).map(card),
      },
      look: lookSlugs
        .map((slug) => bySlug.get(slug))
        .filter((p): p is SeedProduct => Boolean(p))
        .map((p) => ({ product: card(p), variants: variantsOf(p) })),
      reviews,
    };
  },
};
