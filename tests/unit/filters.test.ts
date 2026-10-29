import { describe, expect, it } from "vitest";
import {
  activeFilterCount,
  applyFilters,
  facetsOf,
  filtersToQuery,
  parseFilters,
  parseQuery,
  searchProducts,
} from "@/lib/filters";

describe("parseFilters", () => {
  it("reads sizes and sort", () => {
    const f = parseFilters({ size: ["m", "xl"], sort: "price-asc" });
    expect(f.sizes).toEqual(["M", "XL"]);
    expect(f.sort).toBe("price-asc");
  });

  it("unknown sort falls back to newest", () => {
    expect(parseFilters({ sort: "hack" }).sort).toBe("new");
    expect(parseFilters({}).sort).toBe("new");
  });

  it("ignores a price that is not a whole number", () => {
    const f = parseFilters({ min: "abc", max: "-5" });
    expect(f.minPaise).toBeUndefined();
    expect(f.maxPaise).toBeUndefined();
    expect(parseFilters({ min: "2000" }).minPaise).toBe(200000);
  });

  it("drops anything that is not a known size or a plain colour name", () => {
    const f = parseFilters({
      size: ["<script>", "M", "m", "XXXL"],
      colour: ["Black", "<img src=x>", "washed   black"],
    });
    expect(f.sizes).toEqual(["M"]);
    expect(f.colours).toEqual(["black", "washed black"]);
  });

  it("accepts comma lists and swaps a reversed price range", () => {
    const f = parseFilters({ size: "l,s", min: "9000", max: "3000" });
    expect(f.sizes).toEqual(["S", "L"]);
    expect([f.minPaise, f.maxPaise]).toEqual([300000, 900000]);
  });

  it("caps how many values a URL can carry", () => {
    const many = Array.from(
      { length: 40 },
      (_, i) =>
        `colour ${String.fromCharCode(97 + (i % 26))}${String.fromCharCode(97 + Math.floor(i / 26))}`,
    );
    expect(parseFilters({ colour: many }).colours).toHaveLength(12);
  });

  it("round-trips through the query string", () => {
    const f = parseFilters({ size: ["xl", "m"], colour: "Black", min: "3000", sort: "price-desc" });
    expect(filtersToQuery(f)).toBe("size=m&size=xl&colour=black&min=3000&sort=price-desc");
    expect(
      parseFilters(Object.fromEntries(new URLSearchParams("size=m&colour=black"))),
    ).toMatchObject({ sizes: ["M"], colours: ["black"] });
    expect(filtersToQuery(parseFilters({}))).toBe("");
    expect(activeFilterCount(f)).toBe(4);
  });
});

const products = [
  {
    name: "Tee",
    pricePaise: 220000,
    createdAt: "2026-10-01",
    variants: [
      { size: "M", colour: "Black", stock: 0 },
      { size: "L", colour: "Black", stock: 4 },
      { size: "M", colour: "Bone", stock: 2 },
    ],
  },
  {
    name: "Blazer",
    pricePaise: 1250000,
    createdAt: "2026-10-03",
    variants: [{ size: "M", colour: "Charcoal", stock: 3 }],
  },
  {
    name: "Cargo",
    pricePaise: 420000,
    createdAt: "2026-10-02",
    variants: [{ size: "32", colour: "Olive", stock: 9 }],
  },
];

describe("applyFilters", () => {
  const run = (q: Record<string, string | string[]>) =>
    applyFilters([...products], parseFilters(q)).map((p) => p.name);

  it("newest first by default", () => expect(run({})).toEqual(["Blazer", "Cargo", "Tee"]));
  it("sorts by price", () => {
    expect(run({ sort: "price-asc" })).toEqual(["Tee", "Cargo", "Blazer"]);
    expect(run({ sort: "price-desc" })).toEqual(["Blazer", "Cargo", "Tee"]);
  });
  it("size and colour must match the same in-stock variant", () => {
    expect(run({ size: "m", colour: "black" })).toEqual([]); // black M is sold out
    expect(run({ size: "m", colour: "bone" })).toEqual(["Tee"]);
    expect(run({ size: "m" })).toEqual(["Blazer", "Tee"]);
  });
  it("filters by price range", () => expect(run({ min: "3000", max: "6000" })).toEqual(["Cargo"]));
  it("lists facets in size order", () => {
    expect(facetsOf(products)).toEqual({
      sizes: ["M", "L", "32"],
      colours: ["Black", "Bone", "Charcoal", "Olive"],
    });
  });
});

describe("search", () => {
  const items = [
    {
      name: "Nightfall Riding Jacket",
      searchText: "nightfall riding jacket waxed cotton riding black",
    },
    { name: "Highway Mesh Jacket", searchText: "highway mesh jacket riding mesh signal orange" },
    { name: "Boardroom Blazer", searchText: "boardroom blazer formal wool charcoal" },
  ];
  it("needs every word, ranks name matches first", () => {
    expect(searchProducts(items, "jacket").map((p) => p.name)).toEqual([
      "Highway Mesh Jacket",
      "Nightfall Riding Jacket",
    ]);
    expect(searchProducts(items, "riding orange").map((p) => p.name)).toEqual([
      "Highway Mesh Jacket",
    ]);
    expect(searchProducts(items, "  ")).toEqual([]);
  });
  it("cleans the query", () => {
    expect(parseQuery("  <b>wool</b>   blazer ")).toBe("bwool/b blazer");
    expect(parseQuery("x".repeat(200)).length).toBe(80);
    expect(parseQuery(undefined)).toBe("");
  });
});
