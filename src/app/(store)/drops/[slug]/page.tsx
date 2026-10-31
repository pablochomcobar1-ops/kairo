import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DropStatus } from "@/components/drops/DropStatus";
import { DropAlertForm } from "@/components/home/DropAlertForm";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { buttonClasses } from "@/components/ui/Button";
import { dropDateIST } from "@/lib/countdown";
import { splitDropName } from "@/lib/drops";
import { getDrop, getDrops } from "@/server/catalog";

type Props = PageProps<"/drops/[slug]">;

export async function generateStaticParams() {
  const drops = await getDrops();
  return drops.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const d = await getDrop(slug);
  if (!d) return { title: "Not found", robots: { index: false } };
  const { label, title } = splitDropName(d.name);
  return {
    title: `${label}: ${title}`,
    description: `${d.description} Opens ${dropDateIST(d.startsAt)}.`,
    alternates: { canonical: `/drops/${d.slug}` },
    openGraph: {
      title: `${label}: ${title} · KAIRO`,
      description: d.description,
      url: `/drops/${d.slug}`,
    },
  };
}

/** One drop: the countdown (or "Live now"), an email alert, and every piece in it. */
export default function DropPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="min-h-[70svh]" />}>
      <Drop params={params} />
    </Suspense>
  );
}

async function Drop({ params }: Pick<Props, "params">) {
  const { slug } = await params;
  const d = await getDrop(slug);
  if (!d) notFound();
  const { label, title } = splitDropName(d.name);

  return (
    <>
      <section
        aria-labelledby="drop-title"
        className="relative isolate overflow-hidden px-gutter pt-10 pb-section"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 -right-1/4 -z-10 h-[60rem] w-[60rem] rounded-full opacity-60 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, color-mix(in oklab, var(--k-accent) 22%, transparent), transparent)",
          }}
        />
        <div className="mx-auto flex max-w-site flex-col gap-8">
          <Breadcrumbs
            items={[
              { label: "Drops", href: "/drops" },
              { label, href: `/drops/${d.slug}` },
            ]}
          />
          <Reveal>
            <p className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase">
              {label} · {dropDateIST(d.startsAt)}
            </p>
          </Reveal>
          <div id="drop-title">
            <SplitText
              as="h1"
              immediate
              text={title}
              className="font-display text-hero01 font-bold"
            />
          </div>
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <Reveal delay={0.2} className="flex flex-col gap-8">
              <p className="max-w-xl text-body01 text-foreground-secondary">{d.description}</p>
              <DropStatus startsAt={d.startsAt} endsAt={d.endsAt} />
            </Reveal>
            <Reveal
              delay={0.3}
              className="flex flex-col gap-4 border-t border-border pt-8 lg:border-t-0 lg:pt-0"
            >
              <p className="text-body02 text-foreground-secondary">
                Pieces can be viewed now and bought from the moment it opens. One email when it
                does, nothing else.
              </p>
              <DropAlertForm dropSlug={d.slug} label="Email me when it opens" />
            </Reveal>
          </div>
        </div>
      </section>

      <section aria-labelledby="pieces-title" className="px-gutter pb-section">
        <div className="mx-auto flex max-w-site flex-col gap-8">
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-t border-border pt-8">
            <h2 id="pieces-title" className="font-display text-heading02 font-bold">
              The pieces
            </h2>
            <p className="font-mono text-caption01 tracking-[0.14em] text-foreground-subtle uppercase">
              {d.products.length} pieces · no restock
            </p>
          </div>
          <ProductGrid
            products={d.products}
            empty={
              <>
                <p className="text-body01 text-foreground-secondary">
                  The pieces are revealed closer to the date.
                </p>
                <Link href="/shop" className={buttonClasses("outline")}>
                  Shop everything
                </Link>
              </>
            }
          />
        </div>
      </section>
    </>
  );
}
