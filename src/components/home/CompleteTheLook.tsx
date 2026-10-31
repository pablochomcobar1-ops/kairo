"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import type { LookPiece } from "@/server/catalog/types";
import { Visual } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Field";
import { Price } from "@/components/ui/Price";
import { SplitText } from "@/components/motion/SplitText";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/cn";
import { formatINR } from "@/lib/money";
import { productImageUrl } from "@/lib/images";
import { themeForCollection } from "@/lib/theme";
import { useCart } from "@/stores/cart";
import { useUi } from "@/stores/ui";

/** Where each piece lies in the flat-lay, in % of the frame: wide frame (≥640px) and phone frame. */
const SPOTS = [
  { wide: { left: 28, top: 48, w: 34 }, phone: { left: 32, top: 34, w: 54 }, rot: -4 },
  { wide: { left: 70, top: 64, w: 22 }, phone: { left: 70, top: 68, w: 38 }, rot: 6 },
  { wide: { left: 87, top: 28, w: 14 }, phone: { left: 80, top: 22, w: 28 }, rot: -10 },
  { wide: { left: 58, top: 27, w: 17 }, phone: { left: 28, top: 78, w: 30 }, rot: 3 },
];

/** CSS variables so one element can sit in a different place on phones. */
const place = (s: (typeof SPOTS)[number]) =>
  ({
    "--l": `${s.phone.left}%`,
    "--t": `${s.phone.top}%`,
    "--w": `${s.phone.w}%`,
    "--l-sm": `${s.wide.left}%`,
    "--t-sm": `${s.wide.top}%`,
    "--w-sm": `${s.wide.w}%`,
  }) as CSSProperties;
const PLACE = "left-(--l) top-(--t) sm:left-(--l-sm) sm:top-(--t-sm)";

type Choice = { colour: string; variantId: string };

function firstInStock(piece: LookPiece, colour?: string) {
  const list = piece.variants.filter((v) => (colour ? v.colour === colour : true));
  return list.find((v) => v.stock > 0) ?? list[0];
}

/**
 * 6 · Complete the Look. A flat-lay of one outfit with a hotspot on each piece;
 * a hotspot opens a mini card. "Add the whole look" picks a size for every
 * piece in one dialog and puts them all in the bag.
 */
export function CompleteTheLook({
  look,
  title = "The long\nway home",
  eyebrow = "Complete the look",
}: {
  look: LookPiece[];
  /** headline; "\n" breaks the line */
  title?: string;
  eyebrow?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const [dialog, setDialog] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const uid = useId();
  const add = useCart((s) => s.add);
  const setCartOpen = useUi((s) => s.setCartOpen);
  const theme = themeForCollection(look[0]?.product.collection);

  const [choices, setChoices] = useState<Choice[]>(() =>
    look.map((p) => {
      const v = firstInStock(p);
      return { colour: v?.colour ?? "", variantId: v?.id ?? "" };
    }),
  );

  // close the mini card on Escape or a click elsewhere
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    const onDown = (e: globalThis.PointerEvent) => {
      if (!frame.current?.contains(e.target as Node)) setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const total = useMemo(() => look.reduce((n, p) => n + p.product.pricePaise, 0), [look]);
  if (look.length < 2) return null;

  function addAll() {
    look.forEach((piece, i) => {
      const v = piece.variants.find((x) => x.id === choices[i]?.variantId);
      if (!v || v.stock <= 0) return;
      add({
        variantId: v.id,
        productSlug: piece.product.slug,
        name: piece.product.name,
        size: v.size,
        colour: v.colour,
        image: productImageUrl(piece.product.images[0]?.path),
        unitPaise: piece.product.pricePaise,
        qty: 1,
      });
    });
    setDialog(false);
    setCartOpen(true);
  }

  const anySoldOut = look.some((p, i) => {
    const v = p.variants.find((x) => x.id === choices[i]?.variantId);
    return !v || v.stock <= 0;
  });

  return (
    <section
      data-theme={theme}
      aria-labelledby={`${uid}-title`}
      className="bg-background py-section text-foreground"
    >
      <div className="mx-auto grid max-w-site gap-12 px-gutter lg:grid-cols-[1fr_22rem] lg:items-end">
        <div
          ref={frame}
          className="relative aspect-[4/5] w-full overflow-hidden border border-border bg-background-secondary sm:aspect-[16/10]"
        >
          {/* the flat-lay */}
          {look.slice(0, SPOTS.length).map((piece, i) => {
            const s = SPOTS[i];
            return (
              <motion.div
                key={piece.product.slug}
                aria-hidden="true"
                className={cn(
                  "absolute w-(--w) -translate-x-1/2 -translate-y-1/2 shadow-2xl sm:w-(--w-sm)",
                  PLACE,
                )}
                style={{ ...place(s), rotate: s.rot }}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 30, rotate: s.rot * 2 }}
                whileInView={{ opacity: 1, y: 0, rotate: s.rot }}
                viewport={{ once: true, margin: "-15%" }}
                transition={{ duration: 1.1, delay: 0.12 * i, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative aspect-[3/4]">
                  <Visual product={piece.product} view={0} />
                </div>
              </motion.div>
            );
          })}

          {/* hotspots */}
          {look.slice(0, SPOTS.length).map((piece, i) => {
            const s = SPOTS[i];
            const isOpen = open === i;
            const panelId = `${uid}-spot-${i}`;
            const flip = s.wide.left > 60 || s.phone.left > 60;
            return (
              <div
                key={piece.product.slug}
                className={cn("absolute z-10", isOpen && "z-20", PLACE)}
                style={place(s)}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  aria-label={`${piece.product.name}, ${formatINR(piece.product.pricePaise)}`}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="group relative -mt-[22px] -ml-[22px] flex size-11 items-center justify-center"
                >
                  <span
                    className={cn(
                      "absolute size-7 rounded-full bg-accent/30",
                      !reduce && !isOpen && "animate-ping",
                    )}
                  />
                  <span
                    className={cn(
                      "relative flex size-5 items-center justify-center rounded-full bg-accent text-[13px] leading-none font-bold text-accent-foreground transition-transform duration-200 ease-ui",
                      isOpen && "rotate-45",
                    )}
                  >
                    +
                  </span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="group"
                      aria-label={piece.product.name}
                      initial={{ opacity: 0, scale: 0.94, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
                      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      className={cn(
                        "absolute top-6 flex w-56 flex-col gap-2 border border-border-strong bg-background-tertiary p-4 shadow-2xl",
                        flip ? "right-0 origin-top-right" : "left-0 origin-top-left",
                      )}
                    >
                      <p className="text-body02 font-semibold">{piece.product.name}</p>
                      <Price
                        paise={piece.product.pricePaise}
                        compareAtPaise={piece.product.compareAtPaise}
                        className="text-body02"
                      />
                      <Link
                        href={`/products/${piece.product.slug}`}
                        className="mt-1 font-mono text-caption01 tracking-[0.14em] text-accent uppercase underline-offset-4 hover:underline"
                      >
                        View piece →
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
          <p className="pointer-events-none absolute bottom-4 left-4 font-mono text-caption02 tracking-[0.16em] text-foreground-subtle uppercase">
            Concept visual
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <Reveal>
            <p className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase">
              {eyebrow}
            </p>
          </Reveal>
          <div id={`${uid}-title`}>
            <SplitText text={title} className="font-display text-heading01 font-bold" />
          </div>
          <Reveal delay={0.1}>
            <ul className="flex flex-col divide-y divide-border border-y border-border">
              {look.map((p) => (
                <li
                  key={p.product.slug}
                  className="flex items-baseline justify-between gap-4 py-3 text-body02"
                >
                  <Link href={`/products/${p.product.slug}`} className="hover:text-accent">
                    {p.product.name}
                  </Link>
                  <Price paise={p.product.pricePaise} />
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.2} className="flex flex-col gap-3">
            <Button size="lg" onClick={() => setDialog(true)}>
              Add the whole look
            </Button>
            <p className="text-body02 text-foreground-subtle">
              {look.length} pieces · <span className="font-mono">{formatINR(total)}</span>. Pick
              sizes in the next step.
            </p>
          </Reveal>
        </div>
      </div>

      <Dialog
        open={dialog}
        onOpenChange={setDialog}
        title="Add the whole look"
        description="Choose a colour and size for each piece."
      >
        <div className="flex flex-col gap-6">
          {look.map((piece, i) => {
            const colours = [...new Set(piece.variants.map((v) => v.colour))];
            const choice = choices[i];
            const sizes = piece.variants.filter((v) => v.colour === choice?.colour);
            const update = (next: Partial<Choice>) =>
              setChoices((c) => c.map((x, j) => (j === i ? { ...x, ...next } : x)));
            return (
              <fieldset
                key={piece.product.slug}
                className="flex flex-col gap-3 border-b border-border pb-6 last:border-0 last:pb-0"
              >
                <legend className="flex w-full items-baseline justify-between gap-4 pb-2">
                  <span className="text-body01 font-semibold">{piece.product.name}</span>
                  <Price paise={piece.product.pricePaise} className="text-body02" />
                </legend>
                <div className="grid grid-cols-2 gap-4">
                  {colours.length > 1 ? (
                    <Select
                      label="Colour"
                      value={choice?.colour}
                      onChange={(e) =>
                        update({
                          colour: e.target.value,
                          variantId: firstInStock(piece, e.target.value)?.id ?? "",
                        })
                      }
                    >
                      {colours.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </Select>
                  ) : (
                    <p className="flex flex-col gap-2 text-body02">
                      <span className="font-mono text-caption02 tracking-[0.16em] text-foreground-subtle uppercase">
                        Colour
                      </span>
                      <span className="flex h-12 items-center">{colours[0]}</span>
                    </p>
                  )}
                  <Select
                    label="Size"
                    value={choice?.variantId}
                    onChange={(e) => update({ variantId: e.target.value })}
                  >
                    {sizes.map((v) => (
                      <option key={v.id} value={v.id} disabled={v.stock <= 0}>
                        {v.size}
                        {v.stock <= 0 ? " — sold out" : v.stock <= 3 ? ` — ${v.stock} left` : ""}
                      </option>
                    ))}
                  </Select>
                </div>
              </fieldset>
            );
          })}
          <Button size="lg" onClick={addAll} disabled={anySoldOut}>
            Add {look.length} pieces · {formatINR(total)}
          </Button>
        </div>
      </Dialog>
    </section>
  );
}
