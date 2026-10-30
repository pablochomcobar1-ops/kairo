"use client";

import Link from "next/link";
import type { ProductCardData } from "@/server/catalog/types";
import { ProductCard } from "@/components/product/ProductCard";
import { buttonClasses } from "@/components/ui/Button";
import { useUi } from "@/stores/ui";
import { useWishlist } from "@/stores/wishlist";

export function WishlistGrid({ products }: { products: ProductCardData[] }) {
  const slugs = useWishlist((s) => s.slugs);
  const signedIn = useUi((s) => s.signedIn);
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const saved = slugs.map((s) => bySlug.get(s)).filter((p): p is ProductCardData => Boolean(p));

  if (saved.length === 0) {
    return (
      <div className="flex flex-col items-start gap-5 py-10">
        <p className="font-display text-heading02 font-bold">Nothing saved yet.</p>
        <p className="max-w-md text-body01 text-foreground-secondary">
          Tap the heart on any piece to keep it here.
        </p>
        <Link href="/shop" className={buttonClasses("outline", "md")}>
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {signedIn === false && (
        <p className="text-body02 text-foreground-secondary">
          Saved in this browser.{" "}
          <Link
            href="/login?next=/wishlist"
            className="text-foreground underline underline-offset-4 hover:text-accent"
          >
            Sign in
          </Link>{" "}
          to keep them on every device.
        </p>
      )}
      <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
        {saved.map((p) => (
          <li key={p.slug}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </div>
  );
}
