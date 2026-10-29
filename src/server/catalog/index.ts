import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { fixturesSource } from "./fixtures";
import { supabaseSource } from "./supabase";
import type { CatalogSource, HomeData } from "./types";

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
