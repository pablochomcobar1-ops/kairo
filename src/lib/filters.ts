/**
 * Shop filters live in the URL (?size=m&colour=black&min=2000&sort=price-asc)
 * so a filtered page can be shared and the back button works. Anything a
 * visitor types there is untrusted: unknown values are dropped, never echoed.
 */

export type Sort = "new" | "price-asc" | "price-desc";

export interface Filters {
  sizes: string[];
  colours: string[];
  minPaise?: number;
  maxPaise?: number;
  sort: Sort;
}

export type RawParams = Record<string, string | string[] | undefined>;

/** Display order for sizes; also the whitelist of sizes the URL may ask for. */
export const SIZE_ORDER = [
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "30",
  "32",
  "34",
  "36",
  "38",
  "40",
  "42",
  "44",
  "46",
  "ONE",
];
const SORTS: Sort[] = ["new", "price-asc", "price-desc"];
const MAX_VALUES = 12;
const MAX_RUPEES = 1_000_000;

export const SORT_LABELS: Record<Sort, string> = {
  new: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

/** Price bands offered in the filter bar (rupees). */
export const PRICE_BANDS = [
  { id: "under-3000", label: "Under ₹3,000", min: undefined, max: 2999 },
  { id: "3000-6000", label: "₹3,000 – ₹6,000", min: 3000, max: 6000 },
  { id: "6000-10000", label: "₹6,000 – ₹10,000", min: 6000, max: 10000 },
  { id: "over-10000", label: "Over ₹10,000", min: 10000, max: undefined },
] as const;

function all(v: string | string[] | undefined): string[] {
  if (v === undefined) return [];
  return (Array.isArray(v) ? v : [v]).flatMap((s) => s.split(","));
}

function rupeesParam(v: string | string[] | undefined): number | undefined {
  const raw = Array.isArray(v) ? v[0] : v;
  if (raw === undefined || !/^\d{1,7}$/.test(raw.trim())) return undefined;
  const n = Number(raw.trim());
  return n <= MAX_RUPEES ? n * 100 : undefined;
}

/** Colour names are compared lower-case: "black", "washed black", "black and bone". */
export const colourKey = (c: string) => c.trim().toLowerCase().replace(/\s+/g, " ");

export function parseFilters(params: RawParams): Filters {
  const sizes = [...new Set(all(params.size).map((s) => s.trim().toUpperCase()))]
    .filter((s) => SIZE_ORDER.includes(s))
    .slice(0, MAX_VALUES)
    .sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b));

  const colours = [...new Set(all(params.colour).map(colourKey))]
    .filter((c) => /^[a-z][a-z ]{1,39}$/.test(c))
    .slice(0, MAX_VALUES);

  let minPaise = rupeesParam(params.min);
  let maxPaise = rupeesParam(params.max);
  if (minPaise !== undefined && maxPaise !== undefined && minPaise > maxPaise) {
    [minPaise, maxPaise] = [maxPaise, minPaise];
  }

  const rawSort = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const sort = SORTS.includes(rawSort as Sort) ? (rawSort as Sort) : "new";

  return { sizes, colours, minPaise, maxPaise, sort };
}

/** Filters → query string (without "?"); empty when nothing is set. Stable order. */
export function filtersToQuery(f: Filters): string {
  const p = new URLSearchParams();
  f.sizes.forEach((s) => p.append("size", s.toLowerCase()));
  f.colours.forEach((c) => p.append("colour", c));
  if (f.minPaise !== undefined) p.set("min", String(Math.round(f.minPaise / 100)));
  if (f.maxPaise !== undefined) p.set("max", String(Math.round(f.maxPaise / 100)));
  if (f.sort !== "new") p.set("sort", f.sort);
  return p.toString();
}

export const activeFilterCount = (f: Filters) =>
  f.sizes.length +
  f.colours.length +
  (f.minPaise !== undefined || f.maxPaise !== undefined ? 1 : 0);

/** The minimum a product needs for filtering. */
export interface Filterable {
  pricePaise: number;
  createdAt: string;
  name: string;
  variants: { size: string; colour: string; stock: number }[];
}

/**
 * Keeps products that have an in-stock variant matching the chosen sizes AND
 * colours (so "M" + "black" means a black M exists), within the price range.
 */
export function applyFilters<T extends Filterable>(products: T[], f: Filters): T[] {
  const out = products.filter((p) => {
    if (f.minPaise !== undefined && p.pricePaise < f.minPaise) return false;
    if (f.maxPaise !== undefined && p.pricePaise > f.maxPaise) return false;
    if (f.sizes.length === 0 && f.colours.length === 0) return true;
    return p.variants.some(
      (v) =>
        v.stock > 0 &&
        (f.sizes.length === 0 || f.sizes.includes(v.size.toUpperCase())) &&
        (f.colours.length === 0 || f.colours.includes(colourKey(v.colour))),
    );
  });

  const byName = (a: T, b: T) => a.name.localeCompare(b.name);
  if (f.sort === "price-asc")
    return out.sort((a, b) => a.pricePaise - b.pricePaise || byName(a, b));
  if (f.sort === "price-desc")
    return out.sort((a, b) => b.pricePaise - a.pricePaise || byName(a, b));
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || byName(a, b));
}

/** Which sizes and colours exist in a set of products, for the filter bar. */
export function facetsOf(products: Filterable[]): { sizes: string[]; colours: string[] } {
  const sizes = new Set<string>();
  const colours = new Map<string, string>();
  for (const p of products)
    for (const v of p.variants) {
      sizes.add(v.size.toUpperCase());
      if (!colours.has(colourKey(v.colour))) colours.set(colourKey(v.colour), v.colour);
    }
  return {
    sizes: [...sizes].sort((a, b) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b)),
    colours: [...colours.values()].sort((a, b) => a.localeCompare(b)),
  };
}

/** Search: every word must appear somewhere; name matches rank first. */
export function parseQuery(raw: string | string[] | undefined): string {
  const s = (Array.isArray(raw) ? raw[0] : raw) ?? "";
  return s
    .replace(/[\u0000-\u001f<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

export function searchProducts<T extends { name: string; searchText: string }>(
  products: T[],
  query: string,
): T[] {
  const words = query
    .toLowerCase()
    .split(" ")
    .filter((w) => w.length > 0);
  if (words.length === 0) return [];
  const score = (p: T) => {
    const name = p.name.toLowerCase();
    if (!words.every((w) => p.searchText.includes(w))) return -1;
    return words.reduce((n, w) => n + (name.includes(w) ? 2 : 0) + (name.startsWith(w) ? 1 : 0), 0);
  };
  return products
    .map((p) => ({ p, s: score(p) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s || a.p.name.localeCompare(b.p.name))
    .map((x) => x.p);
}
