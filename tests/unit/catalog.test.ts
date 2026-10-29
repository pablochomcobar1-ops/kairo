import { describe, expect, it, vi } from "vitest";

// "server-only" refuses to load outside the server; in tests it is a no-op
vi.mock("server-only", () => ({}));

const { fixturesSource } = await import("@/server/catalog/fixtures");
const { sizeTableFor } = await import("@/lib/size-guide");

describe("catalog (fixtures source)", () => {
  it("lists every product with variants and search text", async () => {
    const all = await fixturesSource.getCatalog();
    expect(all).toHaveLength(32);
    for (const p of all) {
      expect(p.variants.length).toBeGreaterThan(0);
      expect(p.searchText).toBe(p.searchText.toLowerCase());
      expect(p.totalStock).toBe(p.variants.reduce((n, v) => n + v.stock, 0));
    }
    // some sizes are sold out, so struck-through sizes get exercised
    expect(all.some((p) => p.variants.some((v) => v.stock === 0))).toBe(true);
  });

  it("a product page has its look (itself first), another way and sample reviews", async () => {
    const p = await fixturesSource.getProduct("nightfall-riding-jacket");
    expect(p).not.toBeNull();
    expect(p!.look[0].product.slug).toBe("nightfall-riding-jacket");
    expect(p!.look.length).toBeGreaterThan(1);
    expect(p!.anotherWay).not.toBeNull();
    expect(p!.reviews.every((r) => r.isSample && !r.isVerified)).toBe(true);
    expect(p!.rating.count).toBe(p!.reviews.length);
  });

  it("drop pieces carry their drop; unknown slugs return nothing", async () => {
    const drop = await fixturesSource.getProduct("highway-mesh-jacket");
    expect(drop?.drop?.slug).toBe("drop-01-night-shift");
    expect(await fixturesSource.getProduct("not-a-product")).toBeNull();
  });
});

describe("size guide", () => {
  it("picks the right table", () => {
    expect(sizeTableFor("Static Heavy Tee", ["S", "M"])).toBe("tops");
    expect(sizeTableFor("Overpass Cargo", ["30", "32"])).toBe("bottoms");
    expect(sizeTableFor("Boardroom Blazer", ["38", "40", "42"])).toBe("tailoring");
    expect(sizeTableFor("Gauntlet Gloves", ["S", "M"])).toBe("gloves");
    expect(sizeTableFor("Knit Silk Tie", ["ONE"])).toBeNull();
  });
});
