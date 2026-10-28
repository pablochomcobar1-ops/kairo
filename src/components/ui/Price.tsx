import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/money";

type Props = {
  paise: number;
  /** The old price, when the item is reduced. Must be higher than `paise`. */
  compareAtPaise?: number | null;
  className?: string;
};

/**
 * Prices in JetBrains Mono. A reduced price shows the old one struck through,
 * and screen readers hear "Was ₹9,900, now ₹8,900" instead of two bare numbers.
 */
export function Price({ paise, compareAtPaise, className }: Props) {
  const reduced = compareAtPaise != null && compareAtPaise > paise;
  return (
    <span className={cn("inline-flex items-baseline gap-2 font-mono tabular-nums", className)}>
      {reduced ? (
        <>
          <span className="sr-only">{`Was ${formatINR(compareAtPaise)}, now ${formatINR(paise)}`}</span>
          <s aria-hidden="true" className="text-foreground-subtle">
            {formatINR(compareAtPaise)}
          </s>
          <span aria-hidden="true" className="text-accent">
            {formatINR(paise)}
          </span>
        </>
      ) : (
        <span>{formatINR(paise)}</span>
      )}
    </span>
  );
}
