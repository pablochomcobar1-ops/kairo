import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CollectionLink } from "@/components/layout/CollectionLink";
import { HeroMarker } from "@/components/layout/HeroMarker";
import { PageTheme } from "@/components/layout/PageTheme";
import { Reveal } from "@/components/motion/Reveal";
import { SplitText } from "@/components/motion/SplitText";
import { CatalogResults, ResultsSkeleton } from "@/components/shop/CatalogResults";
import { SilkHero } from "@/components/three/SilkHero";
import { COLLECTIONS, collectionBySlug } from "@/lib/collections";
import { getCatalog } from "@/server/catalog";

type Props = PageProps<"/collections/[slug]">;

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = collectionBySlug(slug);
  if (!c) return { title: "Not found", robots: { index: false } };
  const description = `${c.name} by Kairo: ${c.tagline} Menswear cut in Ahmedabad.`;
  return {
    title: c.name,
    description,
    // one canonical address, whatever filters are in the URL
    alternates: { canonical: c.href },
    openGraph: { title: `${c.name} · KAIRO`, description, url: c.href },
  };
}

/**
 * A collection: its own theme, the silk relit in its colours, then the
 * filterable grid and a way into the other three. Reading the URL happens
 * inside <Suspense> so moving between collections stays instant.
 */
export default function CollectionPage({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<div className="min-h-[70svh]" />}>
      <Collection params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Collection({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const { slug } = await params;
  const collection = collectionBySlug(slug);
  if (!collection) notFound();
  const count = (await getCatalog()).filter((p) => p.collection === collection.slug).length;
  const others = COLLECTIONS.filter((c) => c.slug !== slug);

  return (
    <>
      <PageTheme theme={collection.theme} />
      <section
        aria-labelledby="collection-title"
        className="relative isolate -mt-(--header-h) flex min-h-[72svh] flex-col justify-end overflow-hidden px-gutter pt-32 pb-12"
      >
        <HeroMarker />
        <SilkHero />
        <div className="mx-auto flex w-full max-w-site flex-col gap-5">
          <Breadcrumbs items={[{ label: collection.name, href: collection.href }]} />
          <Reveal>
            <p className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase">
              {collection.number} · {collection.mood}
            </p>
          </Reveal>
          <div id="collection-title">
            <SplitText
              as="h1"
              immediate
              delay={0.1}
              text={collection.name}
              className="font-display text-hero01 font-bold"
            />
          </div>
          <Reveal delay={0.35} className="flex flex-wrap items-baseline justify-between gap-4">
            <p className="text-heading03 text-foreground-secondary">{collection.tagline}</p>
            <p className="font-mono text-caption01 tracking-[0.14em] text-foreground-subtle uppercase">
              {count} pieces
            </p>
          </Reveal>
        </div>
      </section>

      <div className="px-gutter pb-section">
        <Suspense fallback={<ResultsSkeleton />}>
          <CatalogResults
            searchParams={searchParams}
            collection={collection.slug}
            basePath={collection.href}
          />
        </Suspense>
      </div>

      <nav
        aria-label="The other three wardrobes"
        className="border-t border-border px-gutter py-section"
      >
        <div className="mx-auto flex max-w-site flex-col gap-8">
          <p className="font-mono text-caption01 tracking-[0.2em] text-foreground-subtle uppercase">
            The other three wardrobes
          </p>
          <ul className="grid gap-3 sm:grid-cols-3">
            {others.map((c) => (
              <li key={c.slug}>
                <CollectionLink
                  href={c.href}
                  className="group flex min-h-40 flex-col justify-between border border-border-strong p-6 transition-colors hover:border-accent"
                >
                  <span className="font-mono text-caption01 tracking-[0.14em] text-foreground-subtle uppercase">
                    {c.number} · {c.mood}
                  </span>
                  <span className="flex items-end justify-between gap-4">
                    <span className="font-display text-heading02 font-bold transition-colors group-hover:text-accent">
                      {c.name}
                    </span>
                    <span
                      aria-hidden="true"
                      className="transition-transform duration-200 ease-ui group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </span>
                </CollectionLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}
