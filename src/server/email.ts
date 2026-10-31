import "server-only";
import { formatINR } from "@/lib/money";
import { publicSiteUrl } from "@/lib/site-url";

/**
 * Email through Resend's HTTP API (no package needed). Without RESEND_API_KEY
 * nothing is sent and the order still goes through. Without your own domain,
 * Resend only delivers to the address you signed up with.
 */
export async function sendEmail(msg: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email] RESEND_API_KEY not set; skipped "${msg.subject}"`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "KAIRO <onboarding@resend.dev>",
        ...msg,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) console.error("[email] Resend answered", res.status);
    return res.ok;
  } catch (err) {
    console.error("[email] send failed:", err instanceof Error ? err.message : err);
    return false;
  }
}

/** Everything that goes into an email is escaped: names and addresses are typed by shoppers. */
export function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

export interface ConfirmationOrder {
  number: string;
  email: string;
  name: string;
  items: { name: string; size: string; colour: string; qty: number; unitPaise: number }[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

export function orderConfirmationEmail(o: ConfirmationOrder) {
  const track = `${publicSiteUrl()}/track?order=${encodeURIComponent(o.number)}`;
  const rows = o.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0">${escapeHtml(i.name)}<br><span style="color:#8C877E">${escapeHtml(i.colour)} · ${escapeHtml(i.size)} · Qty ${i.qty}</span></td><td style="padding:8px 0;text-align:right;font-family:monospace">${formatINR(i.unitPaise * i.qty)}</td></tr>`,
    )
    .join("");
  const line = (label: string, value: string) =>
    `<tr><td style="padding:4px 0;color:#8C877E">${label}</td><td style="padding:4px 0;text-align:right;font-family:monospace">${value}</td></tr>`;

  const html = `<!doctype html><html><body style="margin:0;background:#0B0B0C;color:#ECE6DA;font-family:Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
<p style="letter-spacing:0.4em;font-weight:bold;font-size:20px;margin:0 0 32px">KAIRO</p>
<h1 style="font-size:24px;margin:0 0 8px">Thank you, ${escapeHtml(o.name.split(" ")[0] || "there")}.</h1>
<p style="color:#A39D93;margin:0 0 24px">Order <strong style="color:#C9A66B;font-family:monospace">${escapeHtml(o.number)}</strong> is placed. We'll email again when it ships.</p>
<table style="width:100%;border-collapse:collapse;border-top:1px solid #3A3833;border-bottom:1px solid #3A3833">${rows}</table>
<table style="width:100%;border-collapse:collapse;margin-top:12px">
${line("Subtotal", formatINR(o.subtotal))}${o.discount ? line("Discount", "−" + formatINR(o.discount)) : ""}${line("Delivery", o.shipping ? formatINR(o.shipping) : "Free")}
<tr><td style="padding:8px 0;font-weight:bold">Total</td><td style="padding:8px 0;text-align:right;font-family:monospace;font-weight:bold">${formatINR(o.total)}</td></tr></table>
<p style="margin:32px 0"><a href="${track}" style="background:#ECE6DA;color:#0B0B0C;padding:14px 24px;text-decoration:none;letter-spacing:0.14em;font-size:13px">TRACK YOUR ORDER</a></p>
<p style="color:#8C877E;font-size:12px">Kairo is a concept store by Jainam Gondaliya. This was a Razorpay test payment: no real money moved.</p>
</div></body></html>`;

  const text = [
    `Thank you. Order ${o.number} is placed.`,
    "",
    ...o.items.map(
      (i) => `${i.name} (${i.colour}, ${i.size}) x${i.qty}  ${formatINR(i.unitPaise * i.qty)}`,
    ),
    "",
    `Total: ${formatINR(o.total)}`,
    `Track it: ${track}`,
    "",
    "Kairo is a concept store. This was a Razorpay test payment: no real money moved.",
  ].join("\n");

  return { to: o.email, subject: `Your Kairo order ${o.number}`, html, text };
}

/** "Your order is on its way": sent when an admin marks an order shipped. */
export function orderShippedEmail(o: { number: string; email: string; name: string }) {
  const track = `${publicSiteUrl()}/track?order=${encodeURIComponent(o.number)}`;
  const first = escapeHtml(o.name.split(" ")[0] || "there");
  const html = `<!doctype html><html><body style="margin:0;background:#0B0B0C;color:#ECE6DA;font-family:Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
<p style="letter-spacing:0.4em;font-weight:bold;font-size:20px;margin:0 0 32px">KAIRO</p>
<h1 style="font-size:24px;margin:0 0 8px">It's on its way, ${first}.</h1>
<p style="color:#A39D93;margin:0 0 24px">Order <strong style="color:#C9A66B;font-family:monospace">${escapeHtml(o.number)}</strong> has shipped and should reach you in 2–4 working days.</p>
<p style="margin:32px 0"><a href="${track}" style="background:#ECE6DA;color:#0B0B0C;padding:14px 24px;text-decoration:none;letter-spacing:0.14em;font-size:13px">TRACK YOUR ORDER</a></p>
<p style="color:#8C877E;font-size:12px">Kairo is a concept store by Jainam Gondaliya. Nothing is really shipped.</p>
</div></body></html>`;
  const text = `Order ${o.number} has shipped and should reach you in 2–4 working days.\nTrack it: ${track}\n\nKairo is a concept store. Nothing is really shipped.`;
  return { to: o.email, subject: `Your Kairo order ${o.number} has shipped`, html, text };
}
