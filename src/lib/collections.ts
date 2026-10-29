import { THEMES, type ThemeName } from "./theme";

/**
 * The four wardrobes, in display order. Navigation, menus and footers read
 * from here; product data comes from the database.
 */
export interface CollectionInfo {
  slug: "streetwear" | "formal" | "old-money" | "riding";
  number: string;
  name: string;
  tagline: string;
  theme: ThemeName;
  mood: string;
  href: string;
}

const base = [
  { slug: "streetwear", name: "Streetwear", tagline: "Built for 2 AM.", theme: "street" },
  { slug: "formal", name: "Formal", tagline: "Walk in. Close it.", theme: "formal" },
  { slug: "old-money", name: "Old Money", tagline: "Never loud. Always noticed.", theme: "old-money" },
  { slug: "riding", name: "Riding", tagline: "Made for the long way home.", theme: "riding" },
] as const;

export const COLLECTIONS: CollectionInfo[] = base.map((c, i) => ({
  ...c,
  number: String(i + 1).padStart(2, "0"),
  mood: THEMES[c.theme].mood,
  href: `/collections/${c.slug}`,
}));

export function collectionBySlug(slug: string): CollectionInfo | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}
