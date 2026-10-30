import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const completePayment = vi.fn(async () => ({ outcome: "paid", orderNumber: "KRO-261030-AB7K" }));
const failPayment = vi.fn(async () => {});
vi.mock("@/server/checkout/complete", () => ({ completePayment, failPayment }));

const { POST } = await import("@/app/api/razorpay/webhook/route");
const { NextRequest } = await import("next/server");

const SECRET = "whsec_test";
const sign = (body: string) => createHmac("sha256", SECRET).update(body).digest("hex");
const call = (body: string, signature = sign(body)) =>
  POST(
    new NextRequest("http://localhost/api/razorpay/webhook", {
      method: "POST",
      body,
      headers: { "x-razorpay-signature": signature },
    }),
  );

const captured = JSON.stringify({
  event: "payment.captured",
  payload: { payment: { entity: { id: "pay_ABC123", order_id: "order_XYZ789" } } },
});

describe("Razorpay webhook", () => {
  beforeEach(() => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", SECRET);
    completePayment.mockClear();
    failPayment.mockClear();
  });
  afterEach(() => vi.unstubAllEnvs());

  it("payment.captured with a valid signature marks the order paid", async () => {
    const res = await call(captured);
    expect(res.status).toBe(200);
    expect(completePayment).toHaveBeenCalledWith("order_XYZ789", "pay_ABC123");
  });

  it("a bad or missing signature changes nothing", async () => {
    expect((await call(captured, sign(captured + "x"))).status).toBe(400);
    expect((await call(captured, "")).status).toBe(400);
    expect(completePayment).not.toHaveBeenCalled();
  });

  it("payment.failed notes the failure; unknown events are acknowledged", async () => {
    const failed = JSON.stringify({
      event: "payment.failed",
      payload: { payment: { entity: { id: "pay_1", order_id: "order_FAIL01" } } },
    });
    expect((await call(failed)).status).toBe(200);
    expect(failPayment).toHaveBeenCalledWith("order_FAIL01");
    expect((await call(JSON.stringify({ event: "refund.created" }))).status).toBe(200);
    expect(completePayment).not.toHaveBeenCalled();
  });

  it("asks Razorpay to retry if the database is down (safe: completing is idempotent)", async () => {
    completePayment.mockRejectedValueOnce(new Error("db down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await call(captured)).status).toBe(500);
    spy.mockRestore();
  });

  it("refuses to run without a webhook secret", async () => {
    vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "");
    expect((await call(captured)).status).toBe(503);
  });
});
