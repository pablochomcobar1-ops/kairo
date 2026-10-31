/** Where a drop is in its life. Worked out in the browser too, so cached pages never go stale. */
export type DropPhase = "upcoming" | "live" | "closed";

export function dropPhase(d: { startsAt: string; endsAt: string | null }, now: number): DropPhase {
  if (new Date(d.startsAt).getTime() > now) return "upcoming";
  if (d.endsAt && new Date(d.endsAt).getTime() <= now) return "closed";
  return "live";
}

/** "Drop 01 — Night Shift" → { label: "Drop 01", title: "Night Shift" } */
export function splitDropName(name: string): { label: string; title: string } {
  const [label, ...rest] = name.split("—").map((s) => s.trim());
  return rest.length ? { label, title: rest.join(" — ") } : { label: "Drop", title: name };
}
