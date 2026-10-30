import { NextResponse, type NextRequest } from "next/server";
import { completePayment, failPayment } from "@/server/checkout/complete";
import { verifyWebhookSignature } from "@/server/razorpay";

/**
 * Razorpay → Kairo. Backs up the browser: if a shopper closes the tab right
 * after paying, this still marks the order paid. The signature is checked
 * over the exact raw body; unsigned or tampered calls get 400 and change
 * nothing. Known events are idempotent (mark_order_paid), unknown ones get 200.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const raw = await request.text();
  if (raw.length > 100_000) return NextResponse.json({ error: "too large" }, { status: 413 });
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature, secret)) {
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const payment = event.payload?.payment?.entity;
  const orderId = payment?.order_id;
  try {
    if (event.event === "payment.captured" && orderId && payment?.id) {
      await completePayment(orderId, payment.id);
    } else if (event.event === "payment.failed" && orderId) {
      await failPayment(orderId);
    }
  } catch (err) {
    console.error("[webhook]", err instanceof Error ? err.message : err);
    // 500 makes Razorpay retry later, which is safe: completing is idempotent
    return NextResponse.json({ error: "retry" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
