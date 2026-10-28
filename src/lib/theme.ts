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
