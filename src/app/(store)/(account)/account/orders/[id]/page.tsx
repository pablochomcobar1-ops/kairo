import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { ProductArt } from "@/components/product/ProductArt";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/money";
import { ORDER_STATUS_LABEL, ORDER_STEPS, stepIndex } from "@/lib/orders";
import { requireUser } from "@/server/auth";
import { createServerClient } from "@/server/supabase/server";

export const metadata: Metadata = { title: "Order", robots: { index: false } };

type Address = {
  name?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
};

export default function OrderPage({ params }: PageProps<"/account/orders/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Order params={params} />
    </Suspense>
  );
}

async function Order({ params }: Pick<PageProps<"/account/orders/[id]">, "params">) {
  const { id } = await params;
  const user = await requireUser(`/account/orders/${id}`);
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createServerClient();
  // Row Level Security returns nothing for someone else's order, so it 404s like a missing one
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, number, status, payment_status, subtotal_paise, discount_paise, shipping_paise, total_paise, coupon_code, shipping_address, created_at, items:order_items ( id, product_name, product_slug, size, colour, unit_price_paise, qty ), events:order_events ( status, created_at )",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!order) notFound();

  const current = stepIndex(order.status);
  const when = new Map((order.events ?? []).map((e) => [e.status, e.created_at]));
  const address = (order.shipping_address ?? {}) as Address;
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      timeZone: "Asia/Kolkata",
    });

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-3">
        <Link
          href="/account"
          className="font-mono text-caption01 tracking-[0.14em] text-foreground-subtle uppercase hover:text-accent"
        >
          ← All orders
        </Link>
        <h1 className="font-display text-heading01 font-bold">Order {order.number}</h1>
        <p className="text-body02 text-foreground-secondary">
          Placed{" "}
          {new Date(order.created_at).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "Asia/Kolkata",
          })}{" "}
          · {ORDER_STATUS_LABEL[order.status]}
        </p>
      </header>

      {order.status === "cancelled" ? (
        <p className="border border-error/40 px-4 py-3 text-body02 text-error">
          This order was cancelled.
        </p>
      ) : (
        <ol className="grid grid-cols-4 gap-2" aria-label="Delivery progress">
          {ORDER_STEPS.map((s, i) => {
            const done = i <= current;
            return (
              <li
                key={s}
                className="flex flex-col gap-3"
                aria-current={i === current ? "step" : undefined}
              >
                <span className={cn("h-1 w-full", done ? "bg-accent" : "bg-border")} />
                <span
                  className={cn(
                    "font-mono text-caption02 tracking-[0.12em] uppercase",
                    done ? "text-foreground" : "text-foreground-subtle",
                  )}
                >
                  {ORDER_STATUS_LABEL[s]}
                </span>
                {when.get(s) && (
                  <span className="text-caption02 text-foreground-subtle">
                    {date(when.get(s)!)}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <div className="grid gap-12 lg:grid-cols-[1fr_20rem]">
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          {(order.items ?? []).map((item) => (
            <li key={item.id} className="flex gap-5 py-5">
              <div className="w-20 shrink-0 overflow-hidden bg-background-secondary">
                <div className="aspect-[3/4]">
                  <ProductArt name={item.product_name} collection="" />
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <Link
                  href={`/products/${item.product_slug}`}
                  className="text-body02 font-semibold hover:text-accent"
                >
                  {item.product_name}
                </Link>
                <span className="text-body02 text-foreground-secondary">
                  {item.colour} · {item.size} · Qty {item.qty}
                </span>
              </div>
              <span className="font-mono text-body02 tabular-nums">
                {formatINR(item.unit_price_paise * item.qty)}
              </span>
            </li>
          ))}
        </ul>

        <aside className="flex flex-col gap-8">
          <dl className="flex flex-col gap-2 text-body02">
            <div className="flex justify-between">
              <dt className="text-foreground-secondary">Subtotal</dt>
              <dd className="font-mono tabular-nums">{formatINR(order.subtotal_paise)}</dd>
            </div>
            {order.discount_paise > 0 && (
              <div className="flex justify-between">
                <dt className="text-foreground-secondary">
                  Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}
                </dt>
                <dd className="font-mono tabular-nums">−{formatINR(order.discount_paise)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-foreground-secondary">Delivery</dt>
              <dd className="font-mono tabular-nums">
                {order.shipping_paise ? formatINR(order.shipping_paise) : "Free"}
              </dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-border pt-3 font-semibold">
              <dt>Total</dt>
              <dd className="font-mono tabular-nums">{formatINR(order.total_paise)}</dd>
            </div>
          </dl>
          <div className="flex flex-col gap-2">
            <h2 className="font-mono text-caption01 tracking-[0.16em] uppercase">Delivering to</h2>
            <address className="flex flex-col text-body02 text-foreground-secondary not-italic">
              <span className="text-foreground">{address.name}</span>
              <span>{address.line1}</span>
              {address.line2 && <span>{address.line2}</span>}
              <span>
                {address.city}, {address.state} {address.pincode}
              </span>
            </address>
          </div>
        </aside>
      </div>
    </div>
  );
}
