import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AdminAction } from "@/components/admin/AdminAction";
import { AdminHeader, AdminSkeleton } from "@/components/admin/AdminPage";
import { CancelOrder } from "@/components/admin/CancelOrder";
import { adminDate, StatusBadge } from "@/components/admin/StatusBadge";
import { canCancel, NEXT_STATUS, NEXT_STATUS_ACTION } from "@/lib/admin";
import { formatINR } from "@/lib/money";
import { ORDER_STATUS_LABEL } from "@/lib/orders";
import { advanceOrder, markRefunded } from "@/server/actions/admin";
import { getOrder, requireAdmin } from "@/server/admin/data";

export const metadata: Metadata = { title: "Order" };

export default function OrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Order params={params} />
    </Suspense>
  );
}

async function Order({ params }: Pick<PageProps<"/admin/orders/[id]">, "params">) {
  const { id } = await params;
  await requireAdmin(`/admin/orders/${id}`);
  const o = await getOrder(id);
  if (!o) notFound();
  const next = NEXT_STATUS[o.status];
  const a = o.address;

  return (
    <>
      <Link
        href="/admin/orders"
        className="mb-6 inline-block font-mono text-caption01 tracking-[0.12em] text-foreground-secondary uppercase hover:text-accent"
      >
        ← Orders
      </Link>
      <AdminHeader eyebrow={adminDate(o.created_at)} title={o.number}>
        <StatusBadge status={o.status} payment={o.payment_status} />
      </AdminHeader>

      <div className="grid grid-cols-1 gap-14 xl:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-12">
          <section
            aria-labelledby="actions-title"
            className="flex flex-col gap-4 border border-border p-5"
          >
            <h2
              id="actions-title"
              className="font-mono text-caption01 tracking-[0.2em] text-foreground-subtle uppercase"
            >
              Next step
            </h2>
            {o.status === "pending_payment" ? (
              <p className="text-body02 text-foreground-secondary">
                Waiting for payment. Nothing to do: it moves on by itself when Razorpay confirms,
                and is cleared after a day if it never does.
              </p>
            ) : next ? (
              <AdminAction
                action={advanceOrder}
                fields={{ orderId: o.id, from: o.status }}
                variant="primary"
              >
                {NEXT_STATUS_ACTION[o.status]}
              </AdminAction>
            ) : (
              <p className="text-body02 text-foreground-secondary">
                {o.status === "delivered"
                  ? "Delivered. Nothing left to do."
                  : "This order is closed."}
              </p>
            )}
            {next === "shipped" && (
              <p className="text-body02 text-foreground-subtle">
                The customer gets a &ldquo;your order has shipped&rdquo; email.
              </p>
            )}
            {canCancel(o.status) && <CancelOrder orderId={o.id} status={o.status} />}
            {o.payment_status === "refund_due" && (
              <div className="flex flex-col gap-2 border-t border-border pt-4">
                <p className="text-body02 text-error">
                  Refund due: {formatINR(o.total_paise)}. Refund payment{" "}
                  <span className="font-mono">{o.razorpay_payment_id}</span> in the Razorpay
                  dashboard (Transactions → Payments), then record it here.
                </p>
                <AdminAction action={markRefunded} fields={{ orderId: o.id }}>
                  Refund sent
                </AdminAction>
              </div>
            )}
          </section>

          <section aria-labelledby="items-title">
            <h2 id="items-title" className="mb-4 font-display text-heading03 font-bold">
              Items
            </h2>
            <ul className="flex flex-col border-t border-border">
              {o.items.map((i) => (
                <li
                  key={i.id}
                  className="flex items-baseline justify-between gap-4 border-b border-border py-3 text-body02"
                >
                  <span>
                    <Link href={`/products/${i.product_slug}`} className="hover:text-accent">
                      {i.product_name}
                    </Link>
                    <span className="block text-foreground-subtle">
                      {i.colour} · {i.size} · Qty {i.qty} × {formatINR(i.unit_price_paise)}
                    </span>
                  </span>
                  <span className="font-mono tabular-nums">
                    {formatINR(i.unit_price_paise * i.qty)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 ml-auto flex max-w-xs flex-col gap-1.5 text-body02">
              {[
                ["Subtotal", formatINR(o.subtotal_paise)],
                ...(o.discount_paise
                  ? [
                      [
                        `Discount${o.coupon_code ? ` (${o.coupon_code})` : ""}`,
                        `−${formatINR(o.discount_paise)}`,
                      ],
                    ]
                  : []),
                ["Delivery", o.shipping_paise ? formatINR(o.shipping_paise) : "Free"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 text-foreground-secondary">
                  <dt>{k}</dt>
                  <dd className="font-mono tabular-nums">{v}</dd>
                </div>
              ))}
              <div className="flex justify-between gap-4 border-t border-border pt-2 font-semibold">
                <dt>Total</dt>
                <dd className="font-mono tabular-nums">{formatINR(o.total_paise)}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="flex flex-col gap-12">
          <section aria-labelledby="customer-title" className="flex flex-col gap-2 text-body02">
            <h2 id="customer-title" className="mb-2 font-display text-heading03 font-bold">
              Customer
            </h2>
            <p>{a.name}</p>
            <p className="text-foreground-secondary">
              <a href={`mailto:${o.email}`} className="hover:text-accent">
                {o.email}
              </a>{" "}
              · {o.phone}
            </p>
            <p className="text-foreground-secondary">
              {o.user_id ? "Has an account" : "Guest checkout"}
            </p>
            <address className="mt-2 flex flex-col text-foreground-secondary not-italic">
              <span>{a.line1}</span>
              {a.line2 && <span>{a.line2}</span>}
              <span>
                {a.city}, {a.state} {a.pincode}
              </span>
            </address>
          </section>

          <section
            aria-labelledby="payment-title"
            className="flex flex-col gap-1 text-body02 text-foreground-secondary"
          >
            <h2
              id="payment-title"
              className="mb-2 font-display text-heading03 font-bold text-foreground"
            >
              Payment
            </h2>
            <p>
              Razorpay order: <span className="font-mono">{o.razorpay_order_id ?? "—"}</span>
            </p>
            <p>
              Payment: <span className="font-mono">{o.razorpay_payment_id ?? "—"}</span>
            </p>
            {o.paid_at && <p>Paid {adminDate(o.paid_at)}</p>}
          </section>

          <section aria-labelledby="history-title">
            <h2 id="history-title" className="mb-4 font-display text-heading03 font-bold">
              History
            </h2>
            <ol className="flex flex-col gap-4 border-l border-border pl-5">
              {o.events.map((e) => (
                <li key={e.id} className="relative text-body02">
                  <span
                    aria-hidden="true"
                    className="absolute top-1.5 -left-[1.6rem] size-2 rounded-full bg-accent"
                  />
                  <span className="font-semibold">{ORDER_STATUS_LABEL[e.status]}</span>{" "}
                  <span className="text-foreground-subtle">· {adminDate(e.created_at)}</span>
                  {e.note && <span className="block text-foreground-secondary">{e.note}</span>}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}
