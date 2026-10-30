import "server-only";
import { orderConfirmationEmail, sendEmail } from "@/server/email";
import { createAdminClient } from "@/server/supabase/admin";

export type PaymentOutcome = "paid" | "already_paid" | "paid_out_of_stock" | "not_found";

/**
 * A verified payment arrived (from the browser or Razorpay's webhook, whichever
 * is first). mark_order_paid locks the order and its stock rows, so the second
 * arrival gets "already_paid": stock and coupon use drop once, and only the
 * call that actually marked it paid sends the confirmation email.
 */
export async function completePayment(
  razorpayOrderId: string,
  paymentId: string,
): Promise<{ outcome: PaymentOutcome; orderNumber: string | null }> {
  const db = createAdminClient();
  const { data: order, error } = await db
    .from("orders")
    .select(
      "id, number, email, shipping_address, subtotal_paise, discount_paise, shipping_paise, total_paise, items:order_items ( product_name, size, colour, qty, unit_price_paise )",
    )
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();
  if (error) throw new Error(`Payment: could not load order: ${error.message}`);
  if (!order) return { outcome: "not_found", orderNumber: null };

  const { data: outcome, error: rpcError } = await db.rpc("mark_order_paid", {
    p_order_id: order.id,
    p_payment_id: paymentId,
  });
  if (rpcError) throw new Error(`Payment: mark_order_paid failed: ${rpcError.message}`);

  if (outcome === "paid") {
    const address = (order.shipping_address ?? {}) as { name?: string };
    await sendEmail(
      orderConfirmationEmail({
        number: order.number,
        email: order.email,
        name: address.name ?? "",
        items: (order.items ?? []).map((i) => ({
          name: i.product_name,
          size: i.size,
          colour: i.colour,
          qty: i.qty,
          unitPaise: i.unit_price_paise,
        })),
        subtotal: order.subtotal_paise,
        discount: order.discount_paise,
        shipping: order.shipping_paise,
        total: order.total_paise,
      }),
    );
  }
  return { outcome: outcome as PaymentOutcome, orderNumber: order.number };
}

/** Razorpay says the payment failed: note it, unless the order was already paid. */
export async function failPayment(razorpayOrderId: string): Promise<void> {
  const db = createAdminClient();
  await db
    .from("orders")
    .update({ payment_status: "failed" })
    .eq("razorpay_order_id", razorpayOrderId)
    .eq("payment_status", "pending");
}
