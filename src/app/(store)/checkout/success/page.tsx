import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Monogram } from "@/components/layout/Logo";
import { buttonClasses } from "@/components/ui/Button";
import { orderNumberSchema } from "@/lib/validation";

export const metadata: Metadata = { title: "Order placed", robots: { index: false } };

/** After payment. Shows only the number from the address bar, never order details. */
export default function SuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  return (
    <div className="px-gutter py-section">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-8 text-center">
        <div className="draw-once">
          <Monogram size={112} />
        </div>
        <Suspense fallback={<div className="min-h-40" />}>
          <Placed searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Placed({ searchParams }: Pick<PageProps<"/checkout/success">, "searchParams">) {
  const params = await searchParams;
  const parsed = orderNumberSchema.safeParse(params.order);
  const number = parsed.success ? parsed.data : null;
  const stockIssue = params.issue === "stock";

  return (
    <>
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-heading01 font-bold">
          {stockIssue ? "Payment received" : "Order placed"}
        </h1>
        {number && (
          <p
            className="font-mono text-heading03 tracking-[0.12em] text-accent"
            aria-label={`Order number ${number.split("").join(" ")}`}
          >
            {number}
          </p>
        )}
        {stockIssue ? (
          <p className="text-body01 text-foreground-secondary">
            Someone bought the last one of a piece in your order just before your payment landed.
            The order is cancelled and the full amount will be refunded (in test mode nothing was
            charged).
          </p>
        ) : (
          <p className="text-body01 text-foreground-secondary">
            Thank you. A confirmation is on its way to your email. Keep the order number to track
            it.
          </p>
        )}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {number && !stockIssue && (
          <Link
            href={`/track?order=${encodeURIComponent(number)}`}
            className={buttonClasses("primary", "md")}
          >
            Track your order
          </Link>
        )}
        <Link href="/shop" className={buttonClasses("outline", "md")}>
          Keep shopping
        </Link>
      </div>
    </>
  );
}
