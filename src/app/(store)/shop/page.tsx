import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CollectionLink } from "@/components/layout/CollectionLink";
import { SplitText } from "@/components/motion/SplitText";
import { CatalogResults, ResultsSkeleton } from "@/components/shop/CatalogResults";
import { COLLECTIONS } from "@/lib/collections";

export const metadata: Metadata = {
  title: "Shop all",
  description:
    "Every Kairo piece: Streetwear, Formal, Old Money and Riding. Filter by size, colour and price.",
  alternates: { canonical: "/shop" },
};

/** Every piece, in Noir, with the same filters as the collections. */
export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <div className="px-gutter pb-section">
      <header className="mx-auto flex max-w-site flex-col gap-6 pt-12 pb-10 md:pt-16">
        <Breadcrumbs items={[{ label: "Shop all", href: "/shop" }]} />
        <SplitText
          as="h1"
          immediate
          text="Shop all"
          className="font-display text-hero01 font-bold"
        />
        <nav aria-label="Collections">
          <ul className="flex flex-wrap gap-2">
            {COLLECTIONS.map((c) => (
              <li key={c.slug}>
                <CollectionLink
                  href={c.href}
                  className="inline-flex min-h-11 items-center gap-2 border border-border-strong px-4 font-mono text-caption01 tracking-[0.14em] uppercase transition-colors hover:border-accent hover:text-accent"
                >
                  <span className="text-accent">{c.number}</span> {c.name}
                </CollectionLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <Suspense fallback={<ResultsSkeleton />}>
        <CatalogResults searchParams={searchParams} basePath="/shop" />
      </Suspense>
    </div>
  );
}
