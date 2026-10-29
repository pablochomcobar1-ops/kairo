"use client";

import { useRef, useState, type PointerEvent } from "react";
import type { ProductImage } from "@/server/catalog/types";
import { cn } from "@/lib/cn";
import { productImageUrl } from "@/lib/images";
import { ProductArt } from "./ProductArt";

function Frame({
  name,
  collection,
  image,
  view,
  priority,
}: {
  name: string;
  collection: string;
  image?: ProductImage;
  view: 0 | 1;
  priority?: boolean;
}) {
  const src = productImageUrl(image?.path);
  const inner = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(false);

  // Zoom lens on desktop: the picture doubles in size around the cursor.
  function move(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || !inner.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    inner.current.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
  }

  return (
    <div
      className="relative aspect-[3/4] w-full shrink-0 snap-center overflow-hidden bg-background-secondary md:cursor-zoom-in"
      onPointerEnter={(e) => e.pointerType === "mouse" && setZoom(true)}
      onPointerLeave={() => setZoom(false)}
      onPointerMove={move}
    >
      <div
        ref={inner}
        className={cn(
          "size-full transition-transform duration-300 ease-out motion-reduce:transition-none",
          zoom && "scale-[1.9] motion-reduce:scale-100",
        )}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element -- next/image arrives with real photos in Task 13
          <img
            src={src}
            alt={image?.alt ?? name}
            className="size-full object-cover"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
          />
        ) : (
          <ProductArt name={name} collection={collection} view={view} />
        )}
      </div>
    </div>
  );
}

/**
 * Product pictures. Phones: swipe sideways with a "1 / 2" counter.
 * Desktop: stacked large, with a zoom lens under the mouse.
 */
export function ProductGallery({
  name,
  collection,
  images,
  compact,
}: {
  name: string;
  collection: string;
  images: ProductImage[];
  /** quick view: just the first picture */
  compact?: boolean;
}) {
  const all = images.length ? images.slice(0, 6) : [undefined, undefined];
  const list = compact ? all.slice(0, 1) : all;
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  return (
    <div className="relative">
      <div
        ref={track}
        tabIndex={0}
        role="region"
        aria-label={`${name} pictures`}
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
        className={cn(
          compact ? "flex" : "-mx-gutter flex",
          "snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto overscroll-x-contain md:mx-0 md:grid md:snap-none md:gap-3 md:overflow-visible [&::-webkit-scrollbar]:hidden",
        )}
      >
        {list.map((img, i) => (
          <Frame
            key={i}
            name={name}
            collection={collection}
            image={img}
            view={(i === 0 ? 0 : 1) as 0 | 1}
            priority={i === 0}
          />
        ))}
      </div>
      {list.length > 1 && (
        <p
          className="pointer-events-none absolute right-0 bottom-3 bg-background/70 px-2.5 py-1 font-mono text-caption02 tabular-nums backdrop-blur-sm md:hidden"
          aria-hidden="true"
        >
          {index + 1} / {list.length}
        </p>
      )}
    </div>
  );
}
