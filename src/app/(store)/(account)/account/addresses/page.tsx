import type { Metadata } from "next";
import { Suspense } from "react";
import { AddressCard, NewAddress } from "@/components/account/AccountForms";
import { Skeleton } from "@/components/ui/Skeleton";
import { requireUser } from "@/server/auth";
import { createServerClient } from "@/server/supabase/server";

export const metadata: Metadata = { title: "Addresses", robots: { index: false } };

export default function AddressesPage() {
  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase">
          Your account
        </p>
        <h1 className="font-display text-heading01 font-bold">Addresses</h1>
        <p className="text-body01 text-foreground-secondary">
          Saved here, they fill in at checkout in one tap.
        </p>
      </header>
      <Suspense fallback={<Skeleton className="h-48" />}>
        <Addresses />
      </Suspense>
    </div>
  );
}

async function Addresses() {
  const user = await requireUser("/account/addresses");
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("addresses")
    .select("id, name, phone, line1, line2, city, state, pincode, is_default")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  const list = data ?? [];
  return (
    <div className="flex flex-col gap-6">
      {list.length > 0 && (
        <ul className="grid gap-4 lg:grid-cols-2">
          {list.map((a) => (
            <li key={a.id}>
              <AddressCard address={a} />
            </li>
          ))}
        </ul>
      )}
      <NewAddress startOpen={list.length === 0} />
    </div>
  );
}
