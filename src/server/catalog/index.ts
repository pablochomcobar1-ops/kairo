import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { fixturesSource } from "./fixtures";
import { supabaseSource } from "./supabase";
import type { CatalogProduct, CatalogSource, DropData, HomeData, ProductDetail } from "./types";

export type * from "./types";

/** Cache tag for everything catalog. The admin panel revalidates it after edits (Task 12). */
export const CATALOG_TAG = "catalog";

/**
 * Which source the site reads. Supabase unless KAIRO_DATA=fixtures is set on
 * purpose (GitHub checks, offline previews). A missing Supabase key never
 * silently falls back: the page errors so it gets noticed.
 */
function source(): CatalogSource {
  return process.env.KAIRO_DATA === "fixtures" ? fixturesSource : supabaseSource;
}

export async function getHomeData(): Promise<HomeData> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return source().getHomeData();
}

/**
 * Every published product, cached. The catalog is small (dozens of pieces), so
 * shop filters, collection pages and search all work on this one cached list
 * instead of a database query per filter combination.
 */
export async function getCatalog(): Promise<CatalogProduct[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return source().getCatalog();
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export async function getProduct(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG, `product:${slug}`);
  if (!SLUG.test(slug) || slug.length > 120) return null;
  return source().getProduct(slug);
}

/** Every drop, newest first, with its pieces. */
export async function getDrops(): Promise<DropData[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CATALOG_TAG);
  return source().getDrops();
}

export async function getDrop(slug: string): Promise<DropData | null> {
  if (!SLUG.test(slug) || slug.length > 120) return null;
  return (await getDrops()).find((d) => d.slug === slug) ?? null;
}
