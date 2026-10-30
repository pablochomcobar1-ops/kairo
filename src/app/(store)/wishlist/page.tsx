import type { Metadata } from "next";
import { Suspense } from "react";
import { WishlistGrid } from "@/components/account/WishlistGrid";
import { toCardData } from "@/components/shop/CatalogResults";
import { getCatalog } from "@/server/catalog";

export const metadata: Metadata = { title: "Wishlist", robots: { index: false } };

/** Saved pieces. The list lives in the browser (and the account once signed in); the cards come from the cached catalog. */
export default function WishlistPage() {
  return (
    <div className="px-gutter pt-12 pb-section md:pt-16">
      <div className="mx-auto flex max-w-site flex-col gap-10">
        <header className="flex flex-col gap-3">
          <p className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase">Saved</p>
          <h1 className="font-display text-hero02 font-bold">Wishlist</h1>
        </header>
        <Suspense fallback={<div className="min-h-64" />}>
          <Grid />
        </Suspense>
      </div>
    </div>
  );
}

async function Grid() {
  const products = (await getCatalog()).map(toCardData);
  return <WishlistGrid products={products} />;
}
