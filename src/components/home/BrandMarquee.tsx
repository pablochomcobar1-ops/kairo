"use client";

import { useEffect, useRef } from "react";
import { useLenis } from "@/components/motion/SmoothScroll";
import { cn } from "@/lib/cn";

/**
 * 2 · A band of brand lines that never ends. It speeds up while you scroll
 * (and reverses when you scroll up), then eases back; hovering pauses it.
 * Reduced motion: the lines sit still.
 */
export function BrandMarquee({ items, className }: { items: string[]; className?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  useEffect(() => {
    const el = track.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const anim = el.getAnimations()[0];
    if (!anim) return;

    let target = 1;
    let rate = 1;
    let hovered = false;
    let raf = 0;
    let lastY = window.scrollY;
    let lastT = performance.now();

    const tick = (t: number) => {
      // scroll velocity in px/ms, from Lenis when present, else from scrollY
      const dt = Math.max(1, t - lastT);
      const v = lenis ? lenis.velocity / 16 : (window.scrollY - lastY) / dt;
      lastY = window.scrollY;
      lastT = t;
      target = hovered ? 0 : 1 + Math.max(-4, Math.min(4, v * 2.2));
      rate += (target - rate) * 0.08;
      if (Math.abs(anim.playbackRate - rate) > 0.01) anim.playbackRate = rate;
      raf = requestAnimationFrame(tick);
    };

    // only run the loop while the band is on screen
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e.isIntersecting) {
        lastT = performance.now();
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(el);

    const enter = () => (hovered = true);
    const leave = () => (hovered = false);
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
    };
  }, [lenis]);

  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((text, i) => (
        <li key={i} className="flex items-center whitespace-nowrap">
          <span className="px-6 font-display text-heading02 font-bold md:px-10">{text}</span>
          <span aria-hidden="true" className="text-accent">
            ✦
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <section
      aria-label="About Kairo"
      className={cn("overflow-hidden border-y border-border py-6 md:py-8", className)}
    >
      <div ref={track} className="flex w-max animate-marquee motion-reduce:animate-none">
        {row(false)}
        {row(true)}
      </div>
    </section>
  );
}
