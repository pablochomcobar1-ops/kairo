import { describe, expect, it } from "vitest";
import * as catalog from "../../supabase/seed/catalog.mjs";
import {
  altFor,
  garmentKind as scriptKind,
  planImport,
  promptsFor,
  SHOOT,
  storagePath,
} from "../../scripts/lib/photos.mjs";
import { garmentKind } from "@/lib/images";

const products = catalog.products;

describe("photo shoot prompts", () => {
  it("has a style for every collection and two prompts for every product", () => {
    for (const c of catalog.collections) expect(SHOOT[c.slug as keyof typeof SHOOT]).toBeDefined();
    for (const p of products) {
      const { front, detail } = promptsFor(p);
      expect(front).toContain(p.colours[0].toLowerCase());
      expect(detail).toContain(p.fabric);
      // never the product's name: image tools print quoted names onto the clothes
      expect(front).not.toContain(p.name);
      expect(detail).not.toContain(p.name);
    }
  });

  it("asks for one adult man and never a woman, in every prompt", () => {
    for (const p of products) {
      for (const prompt of Object.values(promptsFor(p))) {
        expect(prompt).toMatch(/one person: an adult man/);
        expect(prompt).toMatch(/No women/);
        expect(prompt).not.toMatch(/\b(woman|girl|female|she|her)\b/i);
      }
    }
  });

  it("uses the same garment rules as the site's drawings", () => {
    for (const p of products) expect(scriptKind(p.name)).toBe(garmentKind(p.name));
  });

  it("writes alt text for both photos", () => {
    const p = products[0];
    expect(altFor(p, 1)).toMatch(/worn by a model/);
    expect(altFor(p, 2)).toMatch(/close-up/);
  });
});

describe("importing photos", () => {
  it("matches files to products and reports mistakes in plain words", () => {
    const { plan, problems } = planImport(
      [
        "static-heavy-tee/1.jpg",
        "static-heavy-tee/2.PNG",
        "boardroom-blazer/1.webp",
        "boardroom-blazer/1.png",
        "no-such-piece/1.jpg",
        "afterhours-hoodie/front.jpg",
        "loose.jpg",
        "overpass-cargo/2.jpg",
        "static-heavy-tee/.DS_Store",
      ],
      products,
    );
    expect(plan.get("static-heavy-tee")?.photos).toEqual({
      1: "static-heavy-tee/1.jpg",
      2: "static-heavy-tee/2.PNG",
    });
    expect(plan.get("boardroom-blazer")?.photos).toEqual({ 1: "boardroom-blazer/1.webp" });
    expect(problems.join("\n")).toMatch(/two files for photo 1/);
    expect(problems.join("\n")).toMatch(/no product called "no-such-piece"/);
    expect(problems.join("\n")).toMatch(/front\.jpg: name it 1\.jpg/);
    expect(problems.join("\n")).toMatch(/loose\.jpg: put photos in a folder/);
    expect(problems.join("\n")).toMatch(/overpass-cargo: has a close-up \(2\) but no worn photo/);
    expect(problems.join("\n")).not.toMatch(/DS_Store/);
  });

  it("gives each upload a fresh name, so browsers never keep an old photo", () => {
    expect(storagePath("static-heavy-tee", 1, "abcdef0123456789")).toBe(
      "static-heavy-tee/1-abcdef0123.avif",
    );
  });
});
