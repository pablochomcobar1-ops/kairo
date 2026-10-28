import { describe, expect, it } from "vitest";
import { formatINR, rupeesToPaise } from "@/lib/money";

describe("formatINR", () => {
  it.each([
    [149000, "₹1,490"],
    [1490000, "₹14,900"],
    [14900000, "₹1,49,000"], // Indian grouping: lakh, not hundred-thousand
    [5, "₹0.05"],
    [149050, "₹1,490.50"],
    [0, "₹0"],
  ])("%i paise → %s", (paise, text) => {
    expect(formatINR(paise)).toBe(text);
  });

  it("refuses non-integer paise, which would mean a float slipped into money maths", () => {
    expect(() => formatINR(10.5)).toThrow(/integer/);
  });
});

describe("rupeesToPaise", () => {
  it("converts without float drift", () => {
    expect(rupeesToPaise(1490)).toBe(149000);
    expect(rupeesToPaise(19.99)).toBe(1999);
    expect(rupeesToPaise(0.1 + 0.2)).toBe(30);
  });
});
