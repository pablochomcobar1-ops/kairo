import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CollectionLink } from "@/components/layout/CollectionLink";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { ResultsSkeleton, toCardData } from "@/components/shop/CatalogResults";
import { SearchBox } from "@/components/shop/SearchBox";
import { COLLECTIONS } from "@/lib/collections";
import { parseQuery, searchProducts } from "@/lib/filters";
import { getCatalog } from "@/server/catalog";

export const metadata: Metadata = {
  title: "Search",
  description: "Search every Kairo piece.",
  // result pages are endless variations; keep them out of Google
  robots: { index: false, follow: true },
};

const POPULAR = ["Hoodie", "Linen", "Blazer", "Riding jacket", "Cargo"];

export default function SearchPage({ searchParams }: PageProps<"/search">) {
  return (
    <div className="px-gutter pb-section">
      <div className="mx-auto flex max-w-site flex-col gap-10 pt-12 md:pt-16">
        <h1 className="sr-only">Search</h1>
        <Suspense fallback={<div className="h-16 border-b border-border-strong" />}>
          <SearchBox autoFocus />
        </Suspense>
        <Suspense fallback={<ResultsSkeleton />}>
          <Results searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Results({ searchParams }: Pick<PageProps<"/search">, "searchParams">) {
  const [params, all] = await Promise.all([searchParams, getCatalog()]);
  const q = parseQuery(params.q);

  if (!q) return <Suggestions />;

  const found = searchProducts(all, q);
  return (
    <div className="flex flex-col gap-10">
      <p
        className="font-mono text-caption01 tracking-[0.14em] text-foreground-secondary uppercase"
        aria-live="polite"
      >
        {found.length} {found.length === 1 ? "result" : "results"} for “{q}”
      </p>
      <ProductGrid
        products={found.map(toCardData)}
        empty={
          <>
            <p className="font-display text-heading02 font-bold">Nothing for “{q}”.</p>
            <p className="text-body01 text-foreground-secondary">
              Check the spelling, try a simpler word, or start from a wardrobe.
            </p>
            <Suggestions />
          </>
        }
      />
    </div>
  );
}

function Suggestions() {
  return (
    <div className="flex w-full flex-col gap-12">
      <div className="flex flex-col gap-4">
        <p className="font-mono text-caption01 tracking-[0.14em] text-foreground-subtle uppercase">
          Popular
        </p>
        <ul className="flex flex-wrap gap-2">
          {POPULAR.map((p) => (
            <li key={p}>
              <Link
                href={`/search?q=${encodeURIComponent(p.toLowerCase())}`}
                className="inline-flex min-h-11 items-center border border-border-strong px-4 text-body02 transition-colors hover:border-accent hover:text-accent"
              >
                {p}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {COLLECTIONS.map((c) => (
          <li key={c.slug}>
            <CollectionLink
              href={c.href}
              className="group flex min-h-36 flex-col justify-between border border-border-strong p-6 transition-colors hover:border-accent"
            >
              <span className="font-mono text-caption01 tracking-[0.14em] text-foreground-subtle uppercase">
                {c.number} · {c.mood}
              </span>
              <span className="font-display text-heading02 font-bold transition-colors group-hover:text-accent">
                {c.name}
              </span>
            </CollectionLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
