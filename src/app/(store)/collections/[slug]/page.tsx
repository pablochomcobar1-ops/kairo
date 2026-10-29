import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CollectionLink } from "@/components/layout/CollectionLink";
import { PageTheme } from "@/components/layout/PageTheme";
import { COLLECTIONS, collectionBySlug } from "@/lib/collections";

/**
 * TEMPORARY stand-in for the collection page.
 * The real page with products, filters and 3D arrives in Task 7.
 */

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

// Reading the URL happens inside <Suspense> so moving between collections stays instant.
export default function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  return (
    <Suspense fallback={<div className="min-h-[80svh]" />}>
      <CollectionStub params={params} />
    </Suspense>
  );
}

async function CollectionStub({ params }: { params: PageProps<"/collections/[slug]">["params"] }) {
  const { slug } = await params;
  const collection = collectionBySlug(slug);
  if (!collection) notFound();
  const others = COLLECTIONS.filter((c) => c.slug !== slug);

  return (
    <div className="mx-auto flex min-h-[80svh] max-w-site flex-col justify-between gap-16 px-gutter py-section">
      <PageTheme theme={collection.theme} />
      <header className="flex flex-col gap-5">
        <p className="font-mono text-caption01 uppercase text-accent">
          {collection.number} · {collection.mood}
        </p>
        <h1 className="font-display text-hero01 font-bold">{collection.name}</h1>
        <p className="text-heading03 text-foreground-secondary">{collection.tagline}</p>
      </header>

      <nav aria-label="Other wardrobes" className="flex flex-col gap-4 border-t border-border pt-8">
        <p className="font-mono text-caption01 uppercase text-foreground-subtle">The other three wardrobes</p>
        <ul className="grid gap-3 sm:grid-cols-3">
          {others.map((c) => (
            <li key={c.slug}>
              <CollectionLink
                href={c.href}
                className="flex min-h-24 items-end border border-border-strong p-4 font-display text-heading03 font-bold transition-colors hover:border-accent hover:text-accent"
              >
                {c.name}
              </CollectionLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
