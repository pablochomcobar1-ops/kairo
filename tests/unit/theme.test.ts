import { describe, expect, it } from "vitest";
import { THEMES, themeForCollection, themeForPath } from "@/lib/theme";

describe("themeForCollection", () => {
  it.each([
    ["streetwear", "street"],
    ["formal", "formal"],
    ["old-money", "old-money"],
    ["riding", "riding"],
    ["unknown", "noir"],
    ["", "noir"],
  ])("%s → %s", (slug, theme) => {
    expect(themeForCollection(slug)).toBe(theme);
  });
});

describe("themeForPath", () => {
  it.each([
    ["/", undefined, "noir"],
    ["/shop", undefined, "noir"],
    ["/collections/streetwear", undefined, "street"],
    ["/collections/old-money", undefined, "old-money"],
    ["/collections/old-money/", undefined, "old-money"],
    ["/collections/riding?size=m", undefined, "riding"],
    ["/collections/unknown", undefined, "noir"],
    ["/products/nightfall-riding-jacket", "riding", "riding"],
    ["/products/anything", undefined, "noir"],
    ["/checkout", undefined, "noir"],
    ["/cart", undefined, "noir"],
    ["/account/orders/abc", undefined, "noir"],
    ["/admin/orders", "riding", "noir"],
  ] as const)("%s (product in %s) → %s", (path, collection, theme) => {
    expect(themeForPath(path, collection)).toBe(theme);
  });
});

describe("THEMES", () => {
  it("has a curtain colour and label for every theme", () => {
    for (const t of Object.values(THEMES)) {
      expect(t.background).toMatch(/^#[0-9A-F]{6}$/);
      expect(t.foreground).toMatch(/^#[0-9A-F]{6}$/);
      expect(t.label.length).toBeGreaterThan(0);
    }
  });

  it("matches the colours locked in tokens.css", async () => {
    const { readFileSync } = await import("node:fs");
    const css = readFileSync("src/app/tokens.css", "utf8");
    for (const [name, t] of Object.entries(THEMES)) {
      const block = css.split(`[data-theme="${name}"]`)[1]?.split("}")[0] ?? "";
      expect(block, name).toContain(`--k-bg: ${t.background};`);
      expect(block, name).toContain(`--k-fg: ${t.foreground};`);
    }
  });
});
