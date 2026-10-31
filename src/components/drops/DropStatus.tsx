"use client";

import { useCallback, useEffect, useState } from "react";
import { Countdown } from "@/components/home/Countdown";
import { Badge } from "@/components/ui/Badge";
import { dropPhase, type DropPhase } from "@/lib/drops";

/**
 * Upcoming → countdown, live → "Live now", closed → "Closed". Worked out in
 * the browser (the page itself is cached), so it is right at any moment.
 */
export function DropStatus({
  startsAt,
  endsAt,
  compact = false,
}: {
  startsAt: string;
  endsAt: string | null;
  compact?: boolean;
}) {
  const [phase, setPhase] = useState<DropPhase | null>(null);

  useEffect(() => {
    let id = 0;
    const tick = () => {
      setPhase(dropPhase({ startsAt, endsAt }, Date.now()));
      id = window.setTimeout(tick, 15_000);
    };
    tick();
    return () => window.clearTimeout(id);
  }, [startsAt, endsAt]);

  const opened = useCallback(() => setPhase("live"), []);

  if (phase === null) return <div className={compact ? "h-7" : "h-28"} aria-hidden="true" />;
  if (phase === "closed") return <Badge tone="neutral">Closed</Badge>;
  if (phase === "live") return <Badge tone="accent">Live now</Badge>;
  return compact ? (
    <Badge tone="neutral">Upcoming</Badge>
  ) : (
    <Countdown target={startsAt} onDone={opened} />
  );
}
