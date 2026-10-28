import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "accent" | "neutral" | "inverse" | "sample" | "verified";

const tones: Record<BadgeTone, string> = {
  accent: "bg-accent text-accent-foreground",
  neutral: "border border-border-strong text-foreground-secondary",
  inverse: "bg-foreground text-background",
  // seeded reviews: honest, visible, but quiet
  sample: "border border-dashed border-border-strong text-foreground-subtle",
  verified: "border border-accent text-accent",
};

/** Small mono label: "Drop 01", "8 left", "Sample", "Verified buyer". */
export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 font-mono text-caption02 uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
