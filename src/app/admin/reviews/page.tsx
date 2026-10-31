import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminAction } from "@/components/admin/AdminAction";
import { AdminHeader, AdminSkeleton } from "@/components/admin/AdminPage";
import { adminDate } from "@/components/admin/StatusBadge";
import { Stars } from "@/components/product/Stars";
import { Badge } from "@/components/ui/Badge";
import { parseReviewFilter, REVIEW_FILTERS } from "@/lib/admin";
import { cn } from "@/lib/cn";
import { moderateReview } from "@/server/actions/admin";
import { getReviews, requireAdmin } from "@/server/admin/data";

export const metadata: Metadata = { title: "Reviews" };

const LABEL = { pending: "Waiting", approved: "Approved", rejected: "Rejected" } as const;

export default function ReviewsPage({ searchParams }: PageProps<"/admin/reviews">) {
  return (
    <Suspense fallback={<AdminSkeleton />}>
      <Reviews searchParams={searchParams} />
    </Suspense>
  );
}

async function Reviews({ searchParams }: Pick<PageProps<"/admin/reviews">, "searchParams">) {
  await requireAdmin("/admin/reviews");
  const filter = parseReviewFilter((await searchParams).status);
  const reviews = await getReviews(filter);

  return (
    <>
      <AdminHeader title="Reviews" eyebrow="New reviews appear only after you approve them" />
      <nav aria-label="Filter reviews" className="mb-8 flex flex-wrap gap-2">
        {REVIEW_FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "pending" ? "/admin/reviews" : `/admin/reviews?status=${f}`}
            aria-current={f === filter ? "page" : undefined}
            className={cn(
              "min-h-9 border px-3 py-1.5 font-mono text-caption02 tracking-[0.12em] uppercase transition-colors",
              f === filter
                ? "border-foreground bg-foreground text-background"
                : "border-border-strong text-foreground-secondary hover:text-foreground",
            )}
          >
            {LABEL[f]}
          </Link>
        ))}
      </nav>

      {reviews.length === 0 ? (
        <p className="py-10 text-body01 text-foreground-secondary">
          {filter === "pending" ? "Nothing waiting. New reviews show up here first." : "None yet."}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {reviews.map((r) => (
            <li
              key={r.id}
              className="grid grid-cols-1 gap-5 border border-border p-5 lg:grid-cols-[1fr_auto]"
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Stars rating={r.rating} size={14} />
                  {r.is_verified && <Badge tone="verified">Verified buyer</Badge>}
                  {r.is_sample && <Badge tone="sample">Sample</Badge>}
                  <span className="font-mono text-caption02 tracking-[0.12em] text-foreground-subtle uppercase">
                    {r.author_name} · {r.user_id ? "signed in" : "guest"} ·{" "}
                    {adminDate(r.created_at)}
                  </span>
                </div>
                {r.product && (
                  <Link
                    href={`/products/${r.product.slug}`}
                    className="text-body02 text-foreground-secondary hover:text-accent"
                  >
                    {r.product.name}
                  </Link>
                )}
                <p className="text-body01 font-semibold">{r.title}</p>
                <p className="max-w-prose text-body02 whitespace-pre-line text-foreground-secondary">
                  {r.body}
                </p>
                {r.photos.length > 0 && (
                  <ul className="flex flex-wrap gap-2" aria-label="Photos">
                    {r.photos.map((src, i) => (
                      <li key={src}>
                        <a
                          href={src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block size-24 overflow-hidden border border-border hover:opacity-80"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element -- private photos via short-lived links */}
                          <img
                            src={src}
                            alt={`Photo ${i + 1} (opens full size)`}
                            className="size-full object-cover"
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex flex-wrap items-start gap-2 lg:flex-col">
                {r.status !== "approved" && (
                  <AdminAction
                    action={moderateReview}
                    fields={{ reviewId: r.id, decision: "approved" }}
                    variant="primary"
                  >
                    Approve
                  </AdminAction>
                )}
                {r.status !== "rejected" && (
                  <AdminAction
                    action={moderateReview}
                    fields={{ reviewId: r.id, decision: "rejected" }}
                  >
                    Reject
                  </AdminAction>
                )}
                {r.status === "rejected" && (
                  <AdminAction
                    action={moderateReview}
                    fields={{ reviewId: r.id, decision: "delete" }}
                    variant="danger"
                  >
                    Delete for good
                  </AdminAction>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
