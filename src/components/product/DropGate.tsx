"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DropAlertForm } from "@/components/home/DropAlertForm";
import { Countdown } from "@/components/home/Countdown";
import { dropDateIST } from "@/lib/countdown";

/**
 * Drop pieces can't be bought before the drop opens: until then the buy box
 * becomes a countdown and "notify me". (Checkout re-checks this on the server
 * in Task 9, so changing the clock in the browser doesn't help.)
 */
export function DropGate({
  drop,
  children,
}: {
  drop: { slug: string; name: string; startsAt: string } | null;
  children: ReactNode;
}) {
  const [live, setLive] = useState<boolean | null>(drop ? null : true);

  useEffect(() => {
    if (!drop) return;
    const ms = new Date(drop.startsAt).getTime() - Date.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the clock is only known in the browser
    setLive(ms <= 0);
    if (ms > 0 && ms < 2 ** 31) {
      const id = window.setTimeout(() => setLive(true), ms);
      return () => window.clearTimeout(id);
    }
  }, [drop]);

  if (live === null) return <div className="min-h-64" aria-busy="true" />;
  if (live || !drop) return <>{children}</>;

  return (
    <div className="flex flex-col gap-6 border border-accent/40 p-6">
      <p className="font-mono text-caption01 tracking-[0.16em] text-accent uppercase">
        {drop.name.split("—")[0].trim()} · opens {dropDateIST(drop.startsAt)}
      </p>
      <Countdown target={drop.startsAt} size="sm" />
      <DropAlertForm dropSlug={drop.slug} label="Email me when it opens" />
    </div>
  );
}
