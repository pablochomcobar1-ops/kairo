import Link from "next/link";
import { Suspense } from "react";
import { AdminAction } from "@/components/admin/AdminAction";
import { AdminHeader, AdminSkeleton, td, th } from "@/components/admin/AdminPage";
import { adminDate, StatusBadge } from "@/components/admin/StatusBadge";
import { ABANDONED_AFTER_HOURS } from "@/lib/admin";
import { formatINR } from "@/lib/money";
import { clearAbandoned } from "@/server/actions/admin";
import { getOverview, requireAdmin } from "@/server/admin/data";

export default function AdminHome() {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const admin = await requireAdmin("/admin");
  const o = await getOverview();
  const tiles: { label: string; value: string; href: string; hot?: boolean }[] = [
    { label: "Paid orders", value: String(o.paidOrders), href: "/admin/orders" },
    { label: "Revenue (test)", value: formatINR(o.revenue), href: "/admin/orders" },
    {
      label: "To pack or ship",
      value: String(o.toShip),
      href: "/admin/orders?status=placed",
      hot: o.toShip > 0,
    },
    {
      label: "Refunds due",
      value: String(o.refundsDue),
      href: "/admin/orders?status=refund_due",
      hot: o.refundsDue > 0,
    },
    {
      label: "Reviews waiting",
      value: String(o.pendingReviews),
      href: "/admin/reviews",
      hot: o.pendingReviews > 0,
    },
    {
      label: "Open messages",
      value: String(o.openMessages),
      href: "/admin/messages",
      hot: o.openMessages > 0,
    },
  ];

  return (
    <>
      <AdminHeader eyebrow={`Signed in as ${admin.email}`} title="Overview" />

      <ul className="grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t) => (
          <li key={t.label} className="bg-background">
            <Link
              href={t.href}
              className="flex min-h-28 flex-col justify-between gap-3 p-5 transition-colors hover:bg-background-secondary"
            >
              <span className="font-mono text-caption02 tracking-[0.12em] text-foreground-subtle uppercase">
                {t.label}
              </span>
              <span
                className={`font-mono text-heading02 tabular-nums ${t.hot ? "text-accent" : ""}`}
              >
                {t.value}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-14 grid grid-cols-1 gap-14 xl:grid-cols-[1.6fr_1fr]">
        <section aria-labelledby="recent-title">
          <div className="mb-4 flex items-baseline justify-between gap-4">
            <h2 id="recent-title" className="font-display text-heading03 font-bold">
              Latest orders
            </h2>
            <Link
              href="/admin/orders"
              className="font-mono text-caption01 tracking-[0.12em] text-foreground-secondary uppercase hover:text-accent"
            >
              All orders →
            </Link>
          </div>
          {o.recent.length === 0 ? (
            <p className="text-body02 text-foreground-secondary">
              No paid orders yet. Place a test order to see it here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse text-body02">
                <thead>
                  <tr className="border-b border-border-strong">
                    <th className={th}>Order</th>
                    <th className={th}>Customer</th>
                    <th className={th}>Status</th>
                    <th className={`${th} text-right`}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {o.recent.map((r) => (
                    <tr key={r.id} className="border-b border-border">
                      <td className={td}>
                        <Link
                          href={`/admin/orders/${r.id}`}
                          className="font-mono hover:text-accent"
                        >
                          {r.number}
                        </Link>
                        <span className="block text-caption01 text-foreground-subtle">
                          {adminDate(r.createdAt)}
                        </span>
                      </td>
                      <td className={`${td} text-foreground-secondary`}>{r.name || r.email}</td>
                      <td className={td}>
                        <StatusBadge status={r.status} payment={r.paymentStatus} />
                      </td>
                      <td className={`${td} text-right font-mono tabular-nums`}>
                        {formatINR(r.totalPaise)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-14">
          <section aria-labelledby="stock-title">
            <h2 id="stock-title" className="mb-4 font-display text-heading03 font-bold">
              Running low
            </h2>
            {o.lowStock.length === 0 ? (
              <p className="text-body02 text-foreground-secondary">
                Every size has more than a few left.
              </p>
            ) : (
              <ul className="flex flex-col border-t border-border">
                {o.lowStock.map((v) => (
                  <li key={v.id} className="border-b border-border">
                    <Link
                      href={`/admin/products/${v.slug}`}
                      className="flex items-baseline justify-between gap-4 py-3 hover:text-accent"
                    >
                      <span className="text-body02">
                        {v.name}{" "}
                        <span className="text-foreground-subtle">
                          · {v.colour} · {v.size}
                        </span>
                      </span>
                      <span
                        className={`font-mono tabular-nums ${v.stock === 0 ? "text-error" : "text-accent"}`}
                      >
                        {v.stock === 0 ? "Sold out" : `${v.stock} left`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            aria-labelledby="clean-title"
            className="flex flex-col gap-3 border border-border p-5"
          >
            <h2 id="clean-title" className="font-display text-heading03 font-bold">
              Unpaid checkouts
            </h2>
            <p className="text-body02 text-foreground-secondary">
              {o.abandoned === 0
                ? `None older than ${ABANDONED_AFTER_HOURS} hours.`
                : `${o.abandoned} checkout${o.abandoned === 1 ? " was" : "s were"} started more than ${ABANDONED_AFTER_HOURS} hours ago and never paid. They hold no stock; clearing them just tidies up.`}
            </p>
            {o.abandoned > 0 && <AdminAction action={clearAbandoned}>Clear them</AdminAction>}
          </section>
        </div>
      </div>
    </>
  );
}
