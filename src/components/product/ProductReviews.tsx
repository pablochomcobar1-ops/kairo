import type { ReviewData } from "@/server/catalog/types";
import { Badge } from "@/components/ui/Badge";
import { Stars } from "./Stars";

const date = (iso: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));

/** Rating summary, a bar per star level and the reviews themselves, with honest Sample / Verified buyer tags. */
export function ProductReviews({
  reviews,
  rating,
}: {
  reviews: ReviewData[];
  rating: { average: number; count: number };
}) {
  const allSamples = reviews.length > 0 && reviews.every((r) => r.isSample);
  const levels = [5, 4, 3, 2, 1].map((n) => ({
    n,
    count: reviews.filter((r) => r.rating === n).length,
  }));

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="scroll-mt-28 border-t border-border py-section"
    >
      <div className="grid gap-12 md:grid-cols-[18rem_1fr] md:gap-20">
        <div className="flex flex-col gap-5">
          <h2 id="reviews-heading" className="font-display text-heading01 font-bold">
            Reviews
          </h2>
          {rating.count > 0 ? (
            <>
              <div className="flex items-end gap-4">
                <span className="font-mono text-[3.5rem] leading-none tabular-nums">
                  {rating.average.toFixed(1)}
                </span>
                <div className="flex flex-col gap-1 pb-1">
                  <Stars rating={rating.average} size={18} />
                  <span className="text-body02 text-foreground-secondary">
                    {rating.count} {rating.count === 1 ? "review" : "reviews"}
                  </span>
                </div>
              </div>
              <ul className="flex flex-col gap-1.5" aria-label="Reviews by star rating">
                {levels.map(({ n, count }) => (
                  <li
                    key={n}
                    className="flex items-center gap-3 font-mono text-caption02 tabular-nums"
                  >
                    <span className="w-3">{n}</span>
                    <span className="h-1 flex-1 bg-border" aria-hidden="true">
                      <span
                        className="block h-full bg-accent"
                        style={{ width: `${(count / rating.count) * 100}%` }}
                      />
                    </span>
                    <span className="w-4 text-right text-foreground-subtle">{count}</span>
                    <span className="sr-only">{`${count} with ${n} stars`}</span>
                  </li>
                ))}
              </ul>
              {allSamples && (
                <p className="text-body02 text-foreground-subtle">
                  These are <span className="font-mono uppercase">sample</span> reviews written for
                  this concept store, not by real buyers.
                </p>
              )}
            </>
          ) : (
            <p className="text-body02 text-foreground-secondary">No reviews yet.</p>
          )}
        </div>

        {reviews.length > 0 && (
          <ul className="flex flex-col divide-y divide-border">
            {reviews.slice(0, 8).map((r) => (
              <li key={r.id} className="flex flex-col gap-3 py-6 first:pt-0">
                <div className="flex flex-wrap items-center gap-3">
                  <Stars rating={r.rating} size={14} />
                  {r.isVerified ? (
                    <Badge tone="verified">Verified buyer</Badge>
                  ) : r.isSample ? (
                    <Badge tone="sample">Sample</Badge>
                  ) : null}
                </div>
                <p className="text-body01 font-semibold">{r.title}</p>
                <p className="max-w-prose text-body02 text-foreground-secondary">{r.body}</p>
                <p className="font-mono text-caption02 tracking-[0.12em] text-foreground-subtle uppercase">
                  {r.author} · <time dateTime={r.createdAt}>{date(r.createdAt)}</time>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
