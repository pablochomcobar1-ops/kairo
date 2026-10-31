import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminHeader, AdminSkeleton, td, th } from "@/components/admin/AdminPage";
import { adminDate, StatusBadge } from "@/components/admin/StatusBadge";
import {
  ADMIN_ORDER_FILTERS,
  cleanSearch,
  parseOrderFilter,
  type AdminOrderFilter,
} from "@/lib/admin";
import { formatINR } from "@/lib/money";
import { ORDER_STATUS_LABEL } from "@/lib/orders";
import { cn } from "@/lib/cn";
import { getOrders, requireAdmin } from "@/server/admin/data";

export const metadata: Metadata = { title: "Orders" };

const LABEL: Record<AdminOrderFilter, string> = {
  all: "All paid",
  ...ORDER_STATUS_LABEL,
  pending_payment: "Unpaid",
  refund_due: "Refund due",
};

export default function OrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Orders searchParams={searchParams} />
    </Suspense>
  );
}

async function Orders({ searchParams }: Pick<PageProps<"/admin/orders">, "searchParams">) {
  await requireAdmin("/admin/orders");
  const sp = await searchParams;
  const filter = parseOrderFilter(sp.status);
  const q = cleanSearch(sp.q);
  const orders = await getOrders(filter, q);
  const href = (f: AdminOrderFilter) =>
    `/admin/orders?${new URLSearchParams({ ...(f !== "all" && { status: f }), ...(q && { q }) })}`;

  return (
    <>
      <AdminHeader title="Orders">
        <form role="search" className="flex w-full max-w-sm items-end gap-3 sm:w-auto">
          {filter !== "all" && <input type="hidden" name="status" value={filter} />}
          <label className="flex flex-1 flex-col gap-1">
            <span className="font-mono text-caption02 tracking-[0.12em] text-foreground-subtle uppercase">
              Order number or email
            </span>
            <input
              name="q"
              defaultValue={q}
              type="search"
              className="border-0 border-b border-border-strong bg-transparent py-2 text-body01 focus:border-accent focus:outline-none"
            />
          </label>
          <button
            type="submit"
            className="min-h-10 border border-border-strong px-4 font-mono text-caption01 uppercase hover:border-accent hover:text-accent"
          >
            Find
          </button>
        </form>
      </AdminHeader>

      <nav aria-label="Filter orders" className="mb-6 flex flex-wrap gap-2">
        {ADMIN_ORDER_FILTERS.map((f) => (
          <Link
            key={f}
            href={href(f)}
            aria-current={f === filter ? "page" : undefined}
            className={cn(
              "min-h-9 border px-3 py-1.5 font-mono text-caption02 tracking-[0.12em] uppercase transition-colors",
              f === filter
                ? "border-foreground bg-foreground text-background"
                : "border-border-strong text-foreground-secondary hover:text-foreground",
            )}
          >
            {LABEL[f]}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <p className="py-10 text-body01 text-foreground-secondary">
          No orders here{q ? ` matching “${q}”` : ""}.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-body02">
            <caption className="sr-only">{`${orders.length} orders`}</caption>
            <thead>
              <tr className="border-b border-border-strong">
                <th className={th} scope="col">
                  Order
                </th>
                <th className={th} scope="col">
                  Placed
                </th>
                <th className={th} scope="col">
                  Customer
                </th>
                <th className={th} scope="col">
                  Status
                </th>
                <th className={`${th} text-right`} scope="col">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-border transition-colors hover:bg-background-secondary"
                >
                  <td className={td}>
                    <Link href={`/admin/orders/${o.id}`} className="font-mono hover:text-accent">
                      {o.number}
                    </Link>
                  </td>
                  <td className={`${td} text-foreground-secondary`}>{adminDate(o.createdAt)}</td>
                  <td className={td}>
                    {o.name && <span className="block">{o.name}</span>}
                    <span className="text-foreground-subtle">{o.email}</span>
                  </td>
                  <td className={td}>
                    <StatusBadge status={o.status} payment={o.paymentStatus} />
                  </td>
                  <td className={`${td} text-right font-mono tabular-nums`}>
                    {formatINR(o.totalPaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 100 && (
            <p className="mt-4 text-body02 text-foreground-subtle">
              Showing the latest 100. Search to find older ones.
            </p>
          )}
        </div>
      )}
    </>
  );
}
