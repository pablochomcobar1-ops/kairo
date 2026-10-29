/**
 * Collection themes. The colours themselves live in src/app/tokens.css;
 * the few values here are only what the curtain needs before CSS catches up
 * (a test keeps them in sync with tokens.css).
 */

export type ThemeName = "noir" | "street" | "formal" | "old-money" | "riding";

export interface ThemeInfo {
  /** Name shown on the curtain */
  label: string;
  /** Mood line under the name */
  mood: string;
  background: string;
  foreground: string;
  accent: string;
}

export const THEMES: Record<ThemeName, ThemeInfo> = {
  noir: { label: "KAIRO", mood: "Four lives. One label.", background: "#0B0B0C", foreground: "#ECE6DA", accent: "#C9A66B" },
  street: { label: "Streetwear", mood: "Neon Night", background: "#0A0B10", foreground: "#EEF0F7", accent: "#9B87F5" },
  formal: { label: "Formal", mood: "Tailor's Atelier", background: "#121316", foreground: "#EDEEF0", accent: "#B8C0CC" },
  "old-money": { label: "Old Money", mood: "Heritage Library", background: "#F2EDE3", foreground: "#16130F", accent: "#7A5C28" },
  riding: { label: "Riding", mood: "Night Highway", background: "#0D0F10", foreground: "#EFEDEA", accent: "#E8833A" },
};

const COLLECTION_THEMES: Record<string, ThemeName> = {
  streetwear: "street",
  formal: "formal",
  "old-money": "old-money",
  riding: "riding",
};

/** A collection slug's theme; anything unknown falls back to Noir. */
export function themeForCollection(slug: string | null | undefined): ThemeName {
  return (slug && COLLECTION_THEMES[slug]) || "noir";
}

/**
 * The theme a route wears. Only collection and product pages are themed;
 * shop-all, cart, checkout, account and admin always stay Noir.
 * Product pages need their collection's slug, which only the server knows.
 */
export function themeForPath(pathname: string, productCollectionSlug?: string): ThemeName {
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  const [, section, slug] = path.split("/");

  if (section === "collections") return themeForCollection(slug);
  if (section === "products") return themeForCollection(productCollectionSlug);
  return "noir";
}

/**
 * How the silk is lit in each theme (linear-light colours are derived in the shader).
 * fold = how fast the folds move; sheen = how glossy the highlight is.
 */
export interface SilkLook {
  base: string;
  shadow: string;
  light: string;
  sheen: number;
  fold: number;
}

export const SILK: Record<ThemeName, SilkLook> = {
  noir: { base: "#2B2825", shadow: "#070707", light: "#C9A66B", sheen: 0.9, fold: 1 },
  street: { base: "#22213A", shadow: "#06070B", light: "#9B87F5", sheen: 1.15, fold: 1.3 },
  formal: { base: "#2C3036", shadow: "#0C0D0F", light: "#DDE3EC", sheen: 0.75, fold: 0.8 },
  "old-money": { base: "#EFE6D6", shadow: "#A89A80", light: "#FFF4DE", sheen: 0.45, fold: 0.6 },
  riding: { base: "#2B2420", shadow: "#08090A", light: "#E8833A", sheen: 1.2, fold: 1.6 },
};
