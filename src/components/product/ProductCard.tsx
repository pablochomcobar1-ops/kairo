"use client";

import Link from "next/link";
import { motion, useSpring } from "motion/react";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { useEffect, useState, type PointerEvent } from "react";
import type { ProductCardData } from "@/server/catalog/types";
import { cn } from "@/lib/cn";
import { productImageUrl } from "@/lib/images";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { ProductArt } from "./ProductArt";
import { QuickView } from "./QuickView";
import { WishlistButton } from "@/components/account/WishlistButton";

const LOW_STOCK = 5;

/** The product's photo when photos are on, otherwise its drawn artwork. */
export function Visual({ product, view }: { product: ProductCardData; view: 0 | 1 }) {
  const src = productImageUrl(product.images[view]?.path);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- next/image arrives with real photos in Task 13
      <img
        src={src}
        alt={product.images[view]?.alt ?? product.name}
        loading="lazy"
        decoding="async"
        className="size-full object-cover"
      />
    );
  }
  return <ProductArt name={product.name} collection={product.collection} view={view} />;
}

/**
 * A product in a grid or carousel. Desktop: the card leans a few degrees toward
 * the cursor and the second photo fades in. Touch and reduced motion: still.
 */
export function ProductCard({
  product,
  className,
  sizes = "card",
  draggable,
  quickView = true,
}: {
  product: ProductCardData;
  className?: string;
  sizes?: "card" | "wide";
  /** inside a drag carousel: a drag must not count as a click */
  draggable?: { isDragging: () => boolean };
  /** show the "Quick view" button (on by default) */
  quickView?: boolean;
}) {
  const reduce = useReducedMotion();
  const [fine, setFine] = useState(false);
  const rx = useSpring(0, { stiffness: 200, damping: 20 });
  const ry = useSpring(0, { stiffness: 200, damping: 20 });

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const tilt = fine && !reduce;

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (!tilt) return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 7);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 7);
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  const soldOut = product.totalStock <= 0;
  const low = !soldOut && product.totalStock <= LOW_STOCK;
  const reduced = product.compareAtPaise != null && product.compareAtPaise > product.pricePaise;

  return (
    <article className={cn("group relative", className)}>
      {/* the button sits outside the tilting picture so it stays above the card's link */}
      <div className="relative">
        <motion.div
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          style={tilt ? { rotateX: rx, rotateY: ry, transformPerspective: 900 } : undefined}
          className={cn(
            "relative overflow-hidden bg-background-secondary",
            sizes === "wide" ? "aspect-[4/5]" : "aspect-[3/4]",
          )}
        >
          <div className="absolute inset-0 transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]">
            <Visual product={product} view={0} />
          </div>
          {product.images.length > 1 && (
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-0 transition-opacity duration-500 ease-ui group-hover:opacity-100"
            >
              <Visual product={product} view={1} />
            </div>
          )}
          <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap gap-1.5">
            {product.dropSlug && <Badge tone="accent">Drop 01</Badge>}
            {reduced && <Badge tone="inverse">Reduced</Badge>}
            {low && (
              <Badge
                tone="neutral"
                className="animate-pulse-once bg-background/70 backdrop-blur-sm"
              >
                Only {product.totalStock} left
              </Badge>
            )}
            {soldOut && (
              <Badge tone="neutral" className="bg-background/70">
                Sold out
              </Badge>
            )}
          </div>
        </motion.div>
        <WishlistButton
          slug={product.slug}
          name={product.name}
          className="absolute top-1.5 right-1.5 z-10 text-foreground"
        />
        {quickView && (
          <QuickView
            slug={product.slug}
            name={product.name}
            className="absolute right-3 bottom-3 z-10 [@media(hover:hover)]:translate-y-1 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:translate-y-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:translate-y-0 [@media(hover:hover)]:group-hover:opacity-100"
          />
        )}
      </div>

      {/* on narrow cards a sale price drops under the name instead of pushing out of the card */}
      <div className="mt-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <h3 className="min-w-0 text-body02 leading-snug font-semibold">
          <Link
            href={`/products/${product.slug}`}
            draggable={false}
            onClick={(e) => {
              if (draggable?.isDragging()) e.preventDefault();
            }}
            className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-accent"
          >
            {product.name}
          </Link>
        </h3>
        <Price
          paise={product.pricePaise}
          compareAtPaise={product.compareAtPaise}
          className="shrink-0 text-body02"
        />
      </div>
    </article>
  );
}
