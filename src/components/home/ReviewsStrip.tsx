import Link from "next/link";
import type { ReviewSnippet } from "@/server/catalog/types";
import { Badge } from "@/components/ui/Badge";
import { SplitText } from "@/components/motion/SplitText";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5 text-accent" role="img" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 20 20" className="size-4" aria-hidden="true">
          <path
            d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.5 7.7l5.9-.8z"
            fill={n <= rating ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      ))}
    </span>
  );
}

function Card({ r }: { r: ReviewSnippet }) {
  return (
    <figure className="flex h-full w-[19rem] shrink-0 flex-col gap-4 border border-border bg-background-secondary p-6 md:w-[24rem]">
      <div className="flex items-center justify-between gap-3">
        <Stars rating={r.rating} />
        {r.isVerified ? (
          <Badge tone="verified">Verified buyer</Badge>
        ) : r.isSample ? (
          <Badge tone="sample">Sample</Badge>
        ) : null}
      </div>
      <blockquote className="flex flex-col gap-2">
        <p className="text-body01 font-semibold">{r.title}</p>
        <p className="line-clamp-4 text-body02 text-foreground-secondary">{r.body}</p>
      </blockquote>
      <figcaption className="mt-auto flex flex-col gap-0.5 font-mono text-caption02 tracking-[0.12em] text-foreground-subtle uppercase">
        <span>{r.author}</span>
        <Link
          href={`/products/${r.productSlug}`}
          className="text-foreground-secondary hover:text-accent"
        >
          {r.productName}
        </Link>
      </figcaption>
    </figure>
  );
}

/**
 * 8 · Reviews drifting slowly sideways (pauses on hover or focus). Seeded
 * reviews carry a "Sample" tag; "Verified buyer" appears only after a paid order.
 * Reduced motion: a still row you can scroll.
 */
export function ReviewsStrip({ reviews }: { reviews: ReviewSnippet[] }) {
  if (reviews.length === 0) return null;
  const hasSamples = reviews.some((r) => r.isSample);

  return (
    <section aria-labelledby="reviews-title" className="py-section">
      <div className="mx-auto flex max-w-site flex-wrap items-end justify-between gap-4 px-gutter">
        <div id="reviews-title">
          <SplitText text="Worn and rated" className="font-display text-hero02 font-bold" />
        </div>
        {hasSamples && (
          <p className="max-w-xs text-body02 text-foreground-subtle">
            Reviews tagged <span className="font-mono uppercase">Sample</span> are written for this
            concept store, not by real buyers.
          </p>
        )}
      </div>

      <div className="mt-12 overflow-hidden motion-reduce:overflow-x-auto">
        <div className="flex w-max animate-drift focus-within:[animation-play-state:paused] hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:px-gutter">
          <ul className="flex gap-4 pr-4 md:gap-6 md:pr-6">
            {reviews.map((r) => (
              <li key={r.id} className="flex">
                <Card r={r} />
              </li>
            ))}
          </ul>
          {/* second copy makes the loop seamless; hidden from screen readers and keyboard */}
          <ul
            aria-hidden="true"
            inert
            className="flex gap-4 pr-4 motion-reduce:hidden md:gap-6 md:pr-6"
          >
            {reviews.map((r) => (
              <li key={r.id} className="flex">
                <Card r={r} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
