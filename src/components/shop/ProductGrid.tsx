import type { ReactNode } from "react";
import type { ProductCardData } from "@/server/catalog/types";
import { Reveal } from "@/components/motion/Reveal";
import { ProductCard } from "@/components/product/ProductCard";

/**
 * The product grid. Cards rise in one after another (the delay follows the
 * collection's rhythm: Riding is quicker than Old Money). Empty: a message
 * and whatever action the page passes in.
 */
export function ProductGrid({
  products,
  empty,
}: {
  products: ProductCardData[];
  empty?: ReactNode;
}) {
  if (products.length === 0) {
    return <div className="flex flex-col items-start gap-5 py-20">{empty}</div>;
  }
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
      {products.map((p, i) => (
        <Reveal as="li" key={p.slug} delay={(i % 4) * 0.08} y={32}>
          <ProductCard product={p} />
        </Reveal>
      ))}
    </ul>
  );
}
