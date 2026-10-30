import { describe, expect, it } from "vitest";
import {
  addressSchema,
  checkoutSchema,
  emailSchema,
  fieldErrors,
  loginSchema,
  orderNumberSchema,
  phoneSchema,
  pincodeSchema,
  resetSchema,
  reviewSchema,
  safeNextPath,
  signupSchema,
} from "@/lib/validation";

describe("pincode and phone", () => {
  it("accepts a 6-digit pincode, rejects 5 digits or a leading 0", () => {
    expect(pincodeSchema.safeParse("380015").success).toBe(true);
    expect(pincodeSchema.safeParse("38001").success).toBe(false);
    expect(pincodeSchema.safeParse("080015").success).toBe(false);
  });

  it("accepts a 10-digit mobile, with or without +91 and spaces", () => {
    expect(phoneSchema.parse("9876543210")).toBe("9876543210");
    expect(phoneSchema.parse("+91 98765 43210")).toBe("9876543210");
    expect(phoneSchema.parse("098765-43210")).toBe("9876543210");
    expect(phoneSchema.safeParse("12345").success).toBe(false);
    expect(phoneSchema.safeParse("5876543210").success).toBe(false); // must start 6–9
  });
});

describe("email and passwords", () => {
  it("trims and lower-cases email", () => {
    expect(emailSchema.parse("  Jainam@Example.COM ")).toBe("jainam@example.com");
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });

  it("signup needs a real password", () => {
    const base = { fullName: "Jainam G", email: "j@example.com" };
    expect(signupSchema.safeParse({ ...base, password: "short1" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, password: "lettersonly" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, password: "x".repeat(73) + "1" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...base, password: "kairo2026" }).success).toBe(true);
  });

  it("login only needs something in the password box", () => {
    expect(loginSchema.safeParse({ email: "j@example.com", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "j@example.com", password: "anything" }).success).toBe(
      true,
    );
  });

  it("reset password must match", () => {
    const r = resetSchema.safeParse({ password: "kairo2026", confirm: "kairo2027" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).confirm).toMatch(/match/);
  });
});

describe("reviews", () => {
  const ok = {
    productSlug: "static-heavy-tee",
    rating: "5",
    authorName: "Arjun",
    title: "Great",
    body: "Heavy and soft at once.",
  };
  it("accepts a normal review", () => expect(reviewSchema.safeParse(ok).success).toBe(true));
  it("rejects a body over 2,000 characters", () =>
    expect(reviewSchema.safeParse({ ...ok, body: "a".repeat(2001) }).success).toBe(false));
  it("rejects ratings outside 1–5", () => {
    expect(reviewSchema.safeParse({ ...ok, rating: "6" }).success).toBe(false);
    expect(reviewSchema.safeParse({ ...ok, rating: "0" }).success).toBe(false);
  });
});

describe("addresses, orders, checkout", () => {
  const address = {
    name: "Jainam",
    phone: "9876543210",
    line1: "12 Law Garden",
    line2: "",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "380006",
  };

  it("address: state from the list, empty line 2 becomes null", () => {
    const r = addressSchema.parse({ ...address, isDefault: true });
    expect(r.line2).toBeNull();
    expect(addressSchema.safeParse({ ...address, state: "Gotham" }).success).toBe(false);
  });

  it("order numbers", () => {
    expect(orderNumberSchema.parse(" kro-261030-ab7k ")).toBe("KRO-261030-AB7K");
    expect(orderNumberSchema.safeParse("KRO-261030-AB0K").success).toBe(false); // 0 is never used
  });

  it("checkout: quantities 1–5, real variant ids, a non-empty bag", () => {
    const base = { email: "j@example.com", phone: "9876543210", address, couponCode: "" };
    const id = "4f1c2b8e-1d2a-4c3b-9a8e-123456789abc";
    expect(checkoutSchema.safeParse({ ...base, items: [{ variantId: id, qty: 2 }] }).success).toBe(
      true,
    );
    expect(checkoutSchema.safeParse({ ...base, items: [{ variantId: id, qty: 6 }] }).success).toBe(
      false,
    );
    expect(checkoutSchema.safeParse({ ...base, items: [{ variantId: "x", qty: 1 }] }).success).toBe(
      false,
    );
    expect(checkoutSchema.safeParse({ ...base, items: [] }).success).toBe(false);
  });
});

describe("safeNextPath (no open redirects)", () => {
  it("keeps paths on this site", () => {
    expect(safeNextPath("/account/orders")).toBe("/account/orders");
    expect(safeNextPath("/checkout?step=2")).toBe("/checkout?step=2");
  });
  it("refuses other websites and tricks", () => {
    for (const bad of [
      "https://evil.com",
      "//evil.com",
      "/\\evil.com",
      "javascript:alert(1)",
      "",
      null,
      "/a\u0000b",
    ]) {
      expect(safeNextPath(bad)).toBe("/account");
    }
  });
});
