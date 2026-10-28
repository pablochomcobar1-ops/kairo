import { cn } from "@/lib/cn";

/** Placeholder block while content loads. Pulses gently; still under reduced motion. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse bg-background-tertiary motion-reduce:animate-none", className)} />;
}
