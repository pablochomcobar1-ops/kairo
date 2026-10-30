import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay, test mode. The browser never chooses an amount: the server creates
 * the Razorpay order from database prices, and a payment counts only after its
 * signature checks out with our secret (HMAC-SHA256). Card and UPI details are
 * typed into Razorpay's own window and never reach Kairo.
 */

function hmacHex(secret: string, payload: string) {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

/** Constant-time comparison; strings of different length simply fail. */
function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a, "utf8");
  const y = Buffer.from(b, "utf8");
  return x.length === y.length && timingSafeEqual(x, y);
}

/** The signature Razorpay's checkout hands back after a successful payment. */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): boolean {
  if (!orderId || !paymentId || !signature || !secret) return false;
  return safeEqual(hmacHex(secret, `${orderId}|${paymentId}`), signature);
}

/** The X-Razorpay-Signature header on webhooks, over the exact raw body. */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  if (!signature || !secret) return false;
  return safeEqual(hmacHex(secret, rawBody), signature);
}

export function razorpayKeys(): { keyId: string; secret: string } | null {
  const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !secret) return null;
  return { keyId, secret };
}

/** Create a Razorpay order for an amount in paise. Returns its id ("order_…"). */
export async function createRazorpayOrder(
  amountPaise: number,
  receipt: string,
  notes: Record<string, string>,
): Promise<string> {
  const keys = razorpayKeys();
  if (!keys) throw new Error("Razorpay keys are not set");
  // RAZORPAY_API_URL exists only so automated tests can point at a stand-in
  const base = process.env.RAZORPAY_API_URL ?? "https://api.razorpay.com";
  const res = await fetch(`${base}/v1/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${keys.keyId}:${keys.secret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: receipt.slice(0, 40),
      notes,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Razorpay order failed: ${res.status}`);
  const data = (await res.json()) as { id?: string; amount?: number };
  if (!data.id || data.amount !== amountPaise)
    throw new Error("Razorpay returned an unexpected order");
  return data.id;
}
