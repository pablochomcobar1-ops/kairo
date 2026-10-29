"use client";

import Link from "next/link";
import { animate, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type PointerEvent,
} from "react";
import type { ProductCardData } from "@/server/catalog/types";
import { ProductCard } from "@/components/product/ProductCard";
import { IconButton } from "@/components/ui/IconButton";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/ui/icons";
import { SplitText } from "@/components/motion/SplitText";

/**
 * 5 · New In. Drag (mouse or touch) with momentum; arrow buttons and Tab move
 * it too, so it never depends on dragging. A small "Drag" label follows the
 * cursor on desktop.
 */
export function NewInCarousel({ products }: { products: ProductCardData[] }) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLUListElement>(null);
  const x = useMotionValue(0);
  const dragging = useRef(false);
  const [bounds, setBounds] = useState({ min: 0, step: 320 });
  const [edge, setEdge] = useState<"start" | "end" | "middle">("start");
  const reduce = useReducedMotion();

  // cursor label
  const [cursorOn, setCursorOn] = useState(false);
  const cx = useSpring(0, { stiffness: 500, damping: 40 });
  const cy = useSpring(0, { stiffness: 500, damping: 40 });

  const measure = useCallback(() => {
    const v = viewport.current;
    const t = track.current;
    if (!v || !t) return;
    const first = t.children[0] as HTMLElement | undefined;
    const gap = parseFloat(getComputedStyle(t).columnGap || "0") || 0;
    setBounds({
      min: Math.min(0, v.clientWidth - t.scrollWidth),
      step: (first?.offsetWidth ?? 300) + gap,
    });
  }, []);

  useEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (viewport.current) ro.observe(viewport.current);
    return () => ro.disconnect();
  }, [measure]);

  useEffect(
    () =>
      x.on("change", (v) => {
        setEdge(v >= -2 ? "start" : v <= bounds.min + 2 ? "end" : "middle");
      }),
    [x, bounds.min],
  );

  const go = (to: number) => {
    const clamped = Math.max(bounds.min, Math.min(0, to));
    if (reduce) x.set(clamped);
    else animate(x, clamped, { type: "spring", stiffness: 260, damping: 34 });
  };

  const onFocus = (e: FocusEvent<HTMLUListElement>) => {
    // keep a Tab-focused card on screen
    const li = (e.target as HTMLElement).closest("li");
    const v = viewport.current;
    if (!li || !v) return;
    const left = li.offsetLeft + x.get();
    if (left < 0 || left + li.offsetWidth > v.clientWidth) go(-li.offsetLeft);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    cx.set(e.clientX - r.left);
    cy.set(e.clientY - r.top);
  };

  return (
    <section aria-labelledby="new-in-title" className="py-section">
      <div className="mx-auto flex max-w-site items-end justify-between gap-6 px-gutter">
        <div className="flex flex-col gap-3">
          <p className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase">
            {String(products.length).padStart(2, "0")} pieces
          </p>
          <div id="new-in-title">
            <SplitText text="New in" className="font-display text-hero02 font-bold" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/shop"
            className="mr-3 hidden font-mono text-caption01 tracking-[0.14em] text-foreground-secondary uppercase underline-offset-4 hover:text-foreground hover:underline sm:inline"
          >
            Shop all
          </Link>
          <IconButton
            label="Previous pieces"
            icon={<ArrowLeftIcon />}
            disabled={edge === "start"}
            onClick={() => go(x.get() + bounds.step)}
            className="border border-border-strong"
          />
          <IconButton
            label="Next pieces"
            icon={<ArrowRightIcon />}
            disabled={edge === "end"}
            onClick={() => go(x.get() - bounds.step)}
            className="border border-border-strong"
          />
        </div>
      </div>

      <div
        ref={viewport}
        className="relative mt-12 overflow-hidden px-gutter md:cursor-none"
        onPointerMove={onPointerMove}
        onPointerEnter={(e) => e.pointerType === "mouse" && setCursorOn(true)}
        onPointerLeave={() => setCursorOn(false)}
      >
        <motion.ul
          ref={track}
          aria-label="New in"
          drag="x"
          dragConstraints={{ left: bounds.min, right: 0 }}
          dragElastic={0.08}
          dragTransition={{ power: 0.35, timeConstant: 280 }}
          onDragStart={() => (dragging.current = true)}
          onDragEnd={() => setTimeout(() => (dragging.current = false), 60)}
          onFocus={onFocus}
          style={{ x }}
          className="mx-auto flex w-max max-w-none gap-4 md:gap-6"
        >
          {products.map((p) => (
            <li
              key={p.slug}
              className="w-[72vw] shrink-0 sm:w-[44vw] md:w-[30vw] lg:w-[22vw] xl:w-[19rem]"
            >
              <ProductCard product={p} draggable={{ isDragging: () => dragging.current }} />
            </li>
          ))}
        </motion.ul>

        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 hidden size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent font-mono text-caption02 tracking-[0.16em] text-accent-foreground uppercase md:flex"
          style={{ x: cx, y: cy }}
          initial={false}
          animate={{ scale: cursorOn ? 1 : 0, opacity: cursorOn ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          Drag
        </motion.span>
      </div>
    </section>
  );
}
