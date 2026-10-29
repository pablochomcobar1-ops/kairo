import { cn } from "@/lib/cn";

/** Five stars, filled to the rating (halves rounded to the nearest). Read as "4.5 out of 5 stars". */
export function Stars({
  rating,
  size = 16,
  className,
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const filled = Math.round(rating * 2) / 2;
  return (
    <span
      className={cn("inline-flex gap-0.5 text-accent", className)}
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = filled >= n ? 1 : filled >= n - 0.5 ? 0.5 : 0;
        return (
          <svg key={n} viewBox="0 0 20 20" width={size} height={size} aria-hidden="true">
            <defs>
              <clipPath id={`half-${n}`}>
                <rect width="10" height="20" />
              </clipPath>
            </defs>
            <path
              d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.5 7.7l5.9-.8z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            {fill > 0 && (
              <path
                d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.5 7.7l5.9-.8z"
                fill="currentColor"
                clipPath={fill === 0.5 ? `url(#half-${n})` : undefined}
              />
            )}
          </svg>
        );
      })}
    </span>
  );
}
