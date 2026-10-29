import Link from "next/link";
import type { CatalogProduct, CollectionSlug, ProductCardData } from "@/server/catalog/types";
import { getCatalog } from "@/server/catalog";
import { applyFilters, facetsOf, parseFilters, type RawParams } from "@/lib/filters";
import { buttonClasses } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { FilterBar, FiltersProvider, ResultsRegion } from "./ShopFilters";
import { ProductGrid } from "./ProductGrid";

/** Only what a card needs travels to the browser (no stock per size, no search text). */
export const toCardData = ({
  slug,
  name,
  collection,
  pricePaise,
  compareAtPaise,
  images,
  totalStock,
  dropSlug,
}: CatalogProduct): ProductCardData => ({
  slug,
  name,
  collection,
  pricePaise,
  compareAtPaise,
  images,
  totalStock,
  dropSlug,
});

/** Filter bar + grid for /shop (all) or one collection, driven by the URL. */
export async function CatalogResults({
  searchParams,
  collection,
  basePath,
}: {
  searchParams: Promise<RawParams>;
  collection?: CollectionSlug;
  basePath: string;
}) {
  const [params, all] = await Promise.all([searchParams, getCatalog()]);
  const filters = parseFilters(params);
  const scope = collection ? all.filter((p) => p.collection === collection) : all;
  const items = applyFilters([...scope], filters);

  return (
    <FiltersProvider filters={filters}>
      <FilterBar facets={facetsOf(scope)} total={items.length} />
      <div className="mx-auto max-w-site pt-10">
        <ResultsRegion>
          <ProductGrid
            products={items.map(toCardData)}
            empty={
              <>
                <p className="font-display text-heading02 font-bold">
                  Nothing matches those filters.
                </p>
                <p className="text-body01 text-foreground-secondary">
                  Try fewer sizes or colours, or a wider price range.
                </p>
                <Link href={basePath} className={buttonClasses("outline", "md")} scroll={false}>
                  Clear filters
                </Link>
              </>
            }
          />
        </ResultsRegion>
      </div>
    </FiltersProvider>
  );
}

/** What shows while results load the first time. */
export function ResultsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading pieces">
      <div className="-mx-gutter border-y border-border px-gutter py-3">
        <div className="mx-auto flex max-w-site gap-3">
          <Skeleton className="h-11 w-28" />
          <div className="flex-1" />
          <Skeleton className="h-11 w-44" />
        </div>
      </div>
      <ul className="mx-auto grid max-w-site grid-cols-2 gap-x-4 gap-y-12 pt-10 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <li key={i} className="flex flex-col gap-4">
            <Skeleton className="aspect-[3/4]" />
            <Skeleton className="h-4 w-2/3" />
          </li>
        ))}
      </ul>
    </div>
  );
}
