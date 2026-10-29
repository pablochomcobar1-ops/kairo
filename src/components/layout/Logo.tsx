import { cn } from "@/lib/cn";

/**
 * KAIRO wordmark (Direction A): Syncopate Bold, set wide. Drawn as live text
 * so it stays crisp at any size and uses the theme's colour.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display font-bold leading-none tracking-[0.42em] [padding-inline-start:0.42em]",
        className,
      )}
    >
      KAIRO
    </span>
  );
}

/**
 * The K monogram in a double ring. Its strokes carry the classes the loader
 * animates (`mono-ring` draws first, then `mono-k`); elsewhere they show as-is.
 */
export function Monogram({ size = 96, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      aria-hidden="true"
      focusable="false"
      className={cn("text-foreground", className)}
    >
      <circle className="mono-ring" cx="48" cy="48" r="46" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" pathLength="1" />
      <circle className="mono-ring mono-ring-2" cx="48" cy="48" r="40" fill="none" stroke="var(--color-accent)" strokeWidth="0.6" opacity="0.6" pathLength="1" />
      <path
        className="mono-k"
        d="M36 28 V68 M36 50 L60 28 M43 44 L62 68"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="square"
        pathLength="1"
      />
    </svg>
  );
}
