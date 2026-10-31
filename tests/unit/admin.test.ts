import { describe, expect, it } from "vitest";
import {
  canCancel,
  cleanSearch,
  NEXT_STATUS,
  parseOrderFilter,
  parseReviewFilter,
  parseStock,
  productEditSchema,
} from "@/lib/admin";
import { fieldErrors } from "@/lib/validation";

describe("order steps", () => {
  it("moves one step forward, and only placed or packed orders can be cancelled", () => {
    expect(NEXT_STATUS.placed).toBe("packed");
    expect(NEXT_STATUS.packed).toBe("shipped");
    expect(NEXT_STATUS.shipped).toBe("delivered");
    expect(NEXT_STATUS.delivered).toBeUndefined();
    expect(NEXT_STATUS.pending_payment).toBeUndefined(); // only a payment moves it
    expect(canCancel("placed") && canCancel("packed")).toBe(true);
    expect(canCancel("shipped") || canCancel("pending_payment") || canCancel("cancelled")).toBe(
      false,
    );
  });

  it("filters fall back to safe defaults", () => {
    expect(parseOrderFilter("refund_due")).toBe("refund_due");
    expect(parseOrderFilter("'; drop table")).toBe("all");
    expect(parseReviewFilter(undefined)).toBe("pending");
  });

  it("search text loses characters the query builder treats specially", () => {
    expect(cleanSearch("  KRO-261030-AB7K ")).toBe("KRO-261030-AB7K");
    expect(cleanSearch("a,b)(or=1*%")).toBe("abor1");
    expect(cleanSearch("arjun@example.com")).toBe("arjun@example.com");
    expect(cleanSearch(42)).toBe("");
  });
});

describe("product edit form", () => {
  const ok = {
    name: "Static Heavy Tee",
    price: "2200",
    compareAt: "",
    published: "on",
    description: "A tee with weight.",
    fabric: "320 GSM cotton",
    fit: "Boxy",
    care: "Cold wash",
  };

  it("turns rupees into paise and the checkbox into a boolean", () => {
    const r = productEditSchema.parse(ok);
    expect(r).toMatchObject({ price: 220000, compareAt: null, published: true });
    expect(productEditSchema.parse({ ...ok, published: undefined }).published).toBe(false);
  });

  it("refuses a was price that isn't higher, decimals and tiny prices", () => {
    const bad = productEditSchema.safeParse({ ...ok, compareAt: "2000" });
    expect(bad.success || fieldErrors(bad.error).compareAt).toMatch(/higher/);
    expect(productEditSchema.safeParse({ ...ok, price: "22.50" }).success).toBe(false);
    expect(productEditSchema.safeParse({ ...ok, price: "50" }).success).toBe(false);
    expect(productEditSchema.parse({ ...ok, compareAt: "2600" }).compareAt).toBe(260000);
  });

  it("reads stock per size and refuses junk", () => {
    const id = "4f1c2b8e-1d2a-4c3b-9a8e-123456789abc";
    expect(
      parseStock([
        [`stock:${id}`, "12"],
        ["name", "x"],
      ]).stock.get(id),
    ).toBe(12);
    expect(parseStock([[`stock:${id}`, "-1"]]).error).toMatch(/whole number/);
    expect(parseStock([[`stock:${id}`, "1.5"]]).error).toMatch(/whole number/);
    expect(parseStock([["stock:not-a-uuid", "1"]]).error).toMatch(/Unknown/);
  });
});
