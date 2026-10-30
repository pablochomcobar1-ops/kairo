import { describe, expect, it, vi } from "vitest";
import { computeTotals } from "@/lib/pricing";
import { validateCoupon, type Coupon } from "@/lib/coupons";

vi.mock("server-only", () => ({}));
const { verifyPaymentSignature, verifyWebhookSignature } = await import("@/server/razorpay");
const { createHmac } = await import("node:crypto");

describe("computeTotals", () => {
  it("one ₹2,999 item → ₹149 shipping", () => {
    expect(computeTotals([{ unitPaise: 299900, qty: 1 }], 0)).toEqual({
      subtotal: 299900,
      discount: 0,
      shipping: 14900,
      total: 314800,
    });
  });
  it("₹3,000 → free shipping", () => {
    expect(computeTotals([{ unitPaise: 300000, qty: 1 }], 0).shipping).toBe(0);
  });
  it("₹3,200 with ₹500 off → shipping charged (threshold is after discount)", () => {
    expect(computeTotals([{ unitPaise: 320000, qty: 1 }], 50000)).toEqual({
      subtotal: 320000,
      discount: 50000,
      shipping: 14900,
      total: 284900,
    });
  });
  it("a discount never exceeds the subtotal, and an empty bag costs nothing", () => {
    expect(computeTotals([{ unitPaise: 100000, qty: 1 }], 999999).discount).toBe(100000);
    expect(computeTotals([], 0).total).toBe(0);
  });
});

const KAIRO10: Coupon = {
  code: "KAIRO10",
  kind: "percent",
  value: 10,
  min_subtotal_paise: 200000,
  starts_at: null,
  ends_at: null,
  max_uses: null,
  used_count: 0,
  is_active: true,
};
const now = new Date("2026-11-01T10:00:00Z");

describe("validateCoupon", () => {
  it("KAIRO10 on ₹1,999 → below the minimum", () => {
    expect(validateCoupon(KAIRO10, 199900, now)).toEqual({ ok: false, reason: "min_subtotal" });
  });
  it("KAIRO10 on ₹5,000 → ₹500 off", () => {
    expect(validateCoupon(KAIRO10, 500000, now)).toEqual({ ok: true, discountPaise: 50000 });
  });
  it("expired, not started, inactive, used up, missing", () => {
    expect(
      validateCoupon({ ...KAIRO10, ends_at: "2026-10-31T00:00:00Z" }, 500000, now),
    ).toMatchObject({ reason: "expired" });
    expect(
      validateCoupon({ ...KAIRO10, starts_at: "2026-12-01T00:00:00Z" }, 500000, now),
    ).toMatchObject({ reason: "not_started" });
    expect(validateCoupon({ ...KAIRO10, is_active: false }, 500000, now)).toMatchObject({
      reason: "inactive",
    });
    expect(
      validateCoupon({ ...KAIRO10, max_uses: 100, used_count: 100 }, 500000, now),
    ).toMatchObject({ reason: "used_up" });
    expect(validateCoupon(null, 500000, now)).toMatchObject({ reason: "not_found" });
  });
  it("percent and fixed discounts never exceed the subtotal", () => {
    expect(validateCoupon({ ...KAIRO10, value: 90, min_subtotal_paise: 0 }, 1000, now)).toEqual({
      ok: true,
      discountPaise: 900,
    });
    expect(
      validateCoupon(
        { ...KAIRO10, kind: "fixed", value: 50000, min_subtotal_paise: 0 },
        30000,
        now,
      ),
    ).toEqual({ ok: true, discountPaise: 30000 });
  });
});

describe("Razorpay signatures", () => {
  const secret = "test_secret_123";
  const sig = createHmac("sha256", secret).update("order_A|pay_B").digest("hex");

  it("a signature made with the test secret verifies", () => {
    expect(verifyPaymentSignature("order_A", "pay_B", sig, secret)).toBe(true);
  });
  it("a one-character change fails", () => {
    const tampered = (sig[0] === "a" ? "b" : "a") + sig.slice(1);
    expect(verifyPaymentSignature("order_A", "pay_B", tampered, secret)).toBe(false);
    expect(verifyPaymentSignature("order_A", "pay_C", sig, secret)).toBe(false);
  });
  it("a signature of a different length fails without throwing", () => {
    expect(verifyPaymentSignature("order_A", "pay_B", "abc", secret)).toBe(false);
    expect(verifyPaymentSignature("order_A", "pay_B", "", secret)).toBe(false);
  });
  it("webhook signature covers the exact raw body", () => {
    const body = '{"event":"payment.captured"}';
    const good = createHmac("sha256", "wh").update(body).digest("hex");
    expect(verifyWebhookSignature(body, good, "wh")).toBe(true);
    expect(verifyWebhookSignature(body + " ", good, "wh")).toBe(false);
  });
});
