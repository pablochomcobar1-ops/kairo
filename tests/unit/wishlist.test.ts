import { beforeEach, describe, expect, it } from "vitest";
import { MAX_WISHLIST, useWishlist } from "@/stores/wishlist";

describe("wishlist store", () => {
  beforeEach(() => useWishlist.setState({ slugs: [] }));

  it("toggles a piece on and off, newest first", () => {
    const { toggle } = useWishlist.getState();
    expect(toggle("static-heavy-tee")).toBe(true);
    expect(toggle("boardroom-blazer")).toBe(true);
    expect(useWishlist.getState().slugs).toEqual(["boardroom-blazer", "static-heavy-tee"]);
    expect(toggle("static-heavy-tee")).toBe(false);
    expect(useWishlist.getState().slugs).toEqual(["boardroom-blazer"]);
  });

  it("ignores anything that isn't a product slug", () => {
    expect(useWishlist.getState().toggle("<img src=x>")).toBe(false);
    useWishlist.getState().replace(["ok-slug", "../etc", "ok-slug", 42 as unknown as string]);
    expect(useWishlist.getState().slugs).toEqual(["ok-slug"]);
  });

  it("caps the list", () => {
    useWishlist.getState().replace(Array.from({ length: 150 }, (_, i) => `piece-${i}`));
    expect(useWishlist.getState().slugs).toHaveLength(MAX_WISHLIST);
  });

  it("only trusts well-formed saved data", async () => {
    localStorage.setItem(
      "kairo-wishlist-v1",
      JSON.stringify({ state: { slugs: ["good-one", "<bad>"] }, version: 1 }),
    );
    await useWishlist.persist.rehydrate();
    expect(useWishlist.getState().slugs).toEqual(["good-one"]);
    localStorage.setItem(
      "kairo-wishlist-v1",
      JSON.stringify({ state: { slugs: "nope" }, version: 1 }),
    );
    await useWishlist.persist.rehydrate();
    expect(useWishlist.getState().slugs).toEqual([]);
  });
});
