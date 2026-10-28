"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

gsap.registerPlugin(ScrollTrigger);

const LenisContext = createContext<Lenis | null>(null);

/** The smooth-scroll instance (null under reduced motion), e.g. to scroll to a section. */
export function useLenis() {
  return useContext(LenisContext);
}

/**
 * Smooth, weighted scrolling (Lenis) driven by GSAP's ticker, so scroll-linked
 * animations (ScrollTrigger) and the scroll itself share one clock and never
 * drift. Native scrolling under reduced motion and on touch (phones keep their
 * own physics, which people expect).
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const instance = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9, syncTouch: false });
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    // publish on the next frame so this effect only subscribes, never re-renders synchronously
    const raf = requestAnimationFrame(() => setLenis(instance));

    return () => {
      cancelAnimationFrame(raf);
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  // New page: re-measure the document so the scroll limit matches the new content.
  useEffect(() => {
    if (!lenis) return;
    lenis.resize();
    ScrollTrigger.refresh();
  }, [lenis, pathname]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
