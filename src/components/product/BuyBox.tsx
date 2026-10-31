"use client";

import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ProductCardData, VariantData } from "@/server/catalog/types";
import { Price } from "@/components/ui/Price";
import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { productImageUrl } from "@/lib/images";
import { sizeTableFor } from "@/lib/size-guide";
import { SIZE_ORDER } from "@/lib/filters";
import { useCart } from "@/stores/cart";
import { useUi } from "@/stores/ui";
import { SizeGuide } from "./SizeGuide";

type Props = {
  product: Pick<ProductCardData, "slug" | "name" | "pricePaise" | "compareAtPaise" | "images">;
  variants: VariantData[];
  /** show a bar pinned to the bottom of phones once the main button scrolls away */
  sticky?: boolean;
  /** called after the piece is added (quick view closes itself) */
  onAdded?: () => void;
};

const LOW = 3;
const sizeSort = (a: string, b: string) => SIZE_ORDER.indexOf(a) - SIZE_ORDER.indexOf(b);

/**
 * Colour, size and Add to bag. Sizes are real radio buttons (arrow keys move
 * between them); sold-out sizes are struck through and can't be picked. The
 * button turns into "Added ✓" and the bag opens. The price shown here is only
 * for display: checkout charges the price in the database (Task 9).
 */
export function BuyBox({ product, variants, sticky, onAdded }: Props) {
  const reduce = useReducedMotion();
  const uid = useId();
  const add = useCart((s) => s.add);
  const setCartOpen = useUi((s) => s.setCartOpen);

  const colours = useMemo(() => [...new Set(variants.map((v) => v.colour))], [variants]);
  const [colour, setColour] = useState(
    () =>
      colours.find((c) => variants.some((v) => v.colour === c && v.stock > 0)) ?? colours[0] ?? "",
  );
  const sizes = useMemo(
    () => variants.filter((v) => v.colour === colour).sort((a, b) => sizeSort(a.size, b.size)),
    [variants, colour],
  );
  // only one-size pieces (a tie) skip the size picker; a colour that happens to have one size still shows it
  const oneSize = sizes.length === 1 && sizes[0].size === "ONE";
  const [variantId, setVariantId] = useState<string | null>(
    oneSize && sizes[0].stock > 0 ? sizes[0].id : null,
  );
  const chosen = sizes.find((v) => v.id === variantId) ?? null;
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const allSoldOut = variants.every((v) => v.stock <= 0);
  const table = sizeTableFor(product.name, [...new Set(variants.map((v) => v.size))]);

  const mainButton = useRef<HTMLButtonElement>(null);
  const sizeGroup = useRef<HTMLFieldSetElement>(null);
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    if (!sticky || !mainButton.current) return;
    const io = new IntersectionObserver(([e]) =>
      setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0),
    );
    io.observe(mainButton.current);
    return () => io.disconnect();
  }, [sticky]);

  function pickColour(c: string) {
    setColour(c);
    const same = variants.find((v) => v.colour === c && v.size === chosen?.size && v.stock > 0);
    const single = variants.filter((v) => v.colour === c);
    const onlyOne = single.length === 1 && single[0].size === "ONE" && single[0].stock > 0;
    setVariantId(same?.id ?? (onlyOne ? single[0].id : null));
  }

  function addToBag() {
    if (!chosen) {
      setError("Choose a size first.");
      sizeGroup.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      sizeGroup.current
        ?.querySelector<HTMLInputElement>("input:not(:disabled)")
        ?.focus({ preventScroll: true });
      return;
    }
    add({
      variantId: chosen.id,
      productSlug: product.slug,
      name: product.name,
      size: chosen.size,
      colour: chosen.colour,
      image: productImageUrl(product.images[0]?.path),
      unitPaise: product.pricePaise,
      qty: 1,
    });
    setError("");
    setAdded(true);
    onAdded?.();
    window.setTimeout(() => setCartOpen(true), reduce ? 0 : 450);
    window.setTimeout(() => setAdded(false), 1800);
  }

  const label = allSoldOut ? "Sold out" : added ? "Added" : chosen ? "Add to bag" : "Select a size";

  const button = (ref?: React.Ref<HTMLButtonElement>, extra?: string) => (
    <button
      ref={ref}
      type="button"
      onClick={addToBag}
      disabled={allSoldOut}
      aria-describedby={error ? `${uid}-err` : undefined}
      className={cn(
        "relative inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden bg-foreground font-mono text-button tracking-[0.14em] text-background uppercase",
        "transition-[transform,opacity,background-color] duration-150 ease-ui active:scale-[0.98] disabled:opacity-50",
        added && "bg-accent text-accent-foreground",
        extra,
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={label}
          initial={reduce ? { opacity: 0 } : { y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: -14, opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
          className="inline-flex items-center gap-2"
        >
          {label}
          {added && <CheckIcon size={18} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      {colours.length > 1 && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 font-mono text-caption01 tracking-[0.12em] uppercase">
            Colour <span className="text-foreground-secondary normal-case">· {colour}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {colours.map((c) => {
              const out = variants.filter((v) => v.colour === c).every((v) => v.stock <= 0);
              return (
                <label
                  key={c}
                  className={cn(
                    "relative inline-flex min-h-11 cursor-pointer items-center border px-4 text-body02 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent",
                    c === colour
                      ? "border-foreground"
                      : "border-border-strong hover:border-foreground-secondary",
                    out && "text-foreground-subtle line-through",
                  )}
                >
                  <input
                    type="radio"
                    name={`${uid}-colour`}
                    value={c}
                    checked={c === colour}
                    onChange={() => pickColour(c)}
                    className="sr-only"
                  />
                  {c}
                  {out && <span className="sr-only">, sold out</span>}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {!oneSize && (
        <fieldset
          ref={sizeGroup}
          className="flex flex-col"
          aria-describedby={error ? `${uid}-err` : undefined}
        >
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <legend className="font-mono text-caption01 tracking-[0.12em] uppercase">Size</legend>
            {table && <SizeGuide table={table} />}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {sizes.map((v) => {
              const out = v.stock <= 0;
              const on = v.id === variantId;
              return (
                <label
                  key={v.id}
                  className={cn(
                    "relative flex h-12 items-center justify-center border font-mono text-body02 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-accent",
                    out
                      ? "cursor-not-allowed border-border text-foreground-subtle line-through"
                      : "cursor-pointer border-border-strong hover:border-foreground-secondary",
                    on && "text-background",
                  )}
                >
                  <input
                    type="radio"
                    name={`${uid}-size`}
                    value={v.id}
                    checked={on}
                    disabled={out}
                    onChange={() => {
                      setVariantId(v.id);
                      setError("");
                    }}
                    className="sr-only"
                  />
                  {on && (
                    <motion.span
                      layoutId={reduce ? undefined : `${uid}-marker`}
                      className="absolute inset-0 -z-0 bg-foreground"
                      transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    />
                  )}
                  <span className="relative">{v.size}</span>
                  {out && <span className="sr-only">, sold out</span>}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="flex flex-col gap-3">
        <p className="min-h-6 text-body02" aria-live="polite">
          {error ? (
            <span id={`${uid}-err`} className="text-error">
              {error}
            </span>
          ) : chosen && chosen.stock <= LOW ? (
            <span className="text-accent">
              Only {chosen.stock} left{oneSize ? "" : ` in ${chosen.size}`}.
            </span>
          ) : null}
        </p>
        {button(mainButton)}
      </div>

      {sticky && (
        <div
          aria-hidden={!showBar}
          inert={!showBar}
          className={cn(
            "fixed inset-x-0 bottom-0 z-40 flex items-center gap-4 border-t border-border bg-background/95 px-gutter py-3 backdrop-blur-md transition-transform duration-300 ease-drawer md:hidden",
            showBar ? "translate-y-0" : "translate-y-full",
          )}
        >
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-body02 font-semibold">{product.name}</span>
            <Price
              paise={product.pricePaise}
              compareAtPaise={product.compareAtPaise}
              className="text-body02"
            />
          </div>
          <div className="w-44 shrink-0">{button(undefined, "h-12")}</div>
        </div>
      )}
    </div>
  );
}
