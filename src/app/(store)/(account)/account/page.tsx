import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ProfileForm } from "@/components/account/AccountForms";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatINR } from "@/lib/money";
import { requireUser } from "@/server/auth";
import { createServerClient } from "@/server/supabase/server";
import { ORDER_STATUS_LABEL } from "@/lib/orders";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

export default function AccountPage({ searchParams }: PageProps<"/account">) {
  return (
    <Suspense fallback={<AccountSkeleton />}>
      <Account searchParams={searchParams} />
    </Suspense>
  );
}

async function Account({ searchParams }: Pick<PageProps<"/account">, "searchParams">) {
  const [user, params] = await Promise.all([requireUser("/account"), searchParams]);
  const supabase = await createServerClient();
  const [{ data: profile }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
    supabase
      .from("orders")
      .select("id, number, status, total_paise, created_at, items:order_items ( qty )")
      .eq("user_id", user.id)
      .neq("status", "pending_payment")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const first = (profile?.full_name || user.fullName).split(" ")[0];

  return (
    <div className="flex flex-col gap-14">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase">
          Your account
        </p>
        <h1 className="font-display text-heading01 font-bold">
          {first ? `Hello, ${first}.` : "Hello."}
        </h1>
        {params.updated === "password" && (
          <p role="status" className="text-body02 text-foreground-secondary">
            Your password has been changed.
          </p>
        )}
      </header>

      <section aria-labelledby="orders-h" className="flex flex-col gap-6">
        <h2 id="orders-h" className="font-mono text-caption01 tracking-[0.16em] uppercase">
          Orders
        </h2>
        {orders && orders.length > 0 ? (
          <ul className="flex flex-col divide-y divide-border border-y border-border">
            {orders.map((o) => {
              const pieces = (o.items ?? []).reduce((n, i) => n + i.qty, 0);
              return (
                <li key={o.id}>
                  <Link
                    href={`/account/orders/${o.id}`}
                    className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 py-5 transition-colors hover:text-accent sm:grid-cols-[1fr_auto_auto_auto]"
                  >
                    <span className="font-mono text-body02">{o.number}</span>
                    <span className="text-body02 text-foreground-secondary sm:order-none">
                      {ORDER_STATUS_LABEL[o.status]}
                    </span>
                    <span className="text-body02 text-foreground-subtle">
                      {new Date(o.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        timeZone: "Asia/Kolkata",
                      })}{" "}
                      · {pieces} {pieces === 1 ? "piece" : "pieces"}
                    </span>
                    <span className="font-mono text-body02 tabular-nums">
                      {formatINR(o.total_paise)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-start gap-4 border border-border p-6">
            <p className="text-body01">No orders yet.</p>
            <Link
              href="/shop"
              className="font-mono text-caption01 tracking-[0.14em] text-accent uppercase underline-offset-4 hover:underline"
            >
              Start with the shop →
            </Link>
          </div>
        )}
      </section>

      <section aria-labelledby="details-h" className="flex flex-col gap-6">
        <h2 id="details-h" className="font-mono text-caption01 tracking-[0.16em] uppercase">
          Your details
        </h2>
        <ProfileForm
          fullName={profile?.full_name ?? user.fullName}
          phone={profile?.phone ?? ""}
          email={user.email}
        />
      </section>
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="flex flex-col gap-10" aria-busy="true">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-40" />
      <Skeleton className="h-56" />
    </div>
  );
}
