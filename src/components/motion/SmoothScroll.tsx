"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { RouteWatcher } from "@/components/layout/RouteWatcher";

const LenisContext = createContext<Lenis | null>(null);

/** The smooth-scroll instance (null under reduced motion), e.g. to scroll to a section. */
export function useLenis() {
  return useContext(LenisContext);
}

/**
 * Smooth, weighted scrolling (Lenis). Native scrolling under reduced motion and
 * on touch (phones keep their own physics, which people expect). GSAP is not
 * loaded here: the one feature that needs ScrollTrigger (the 3D journey) loads
 * it itself and hooks into this Lenis instance, so ordinary pages stay light.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const instance = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 0.9,
      syncTouch: false,
      autoRaf: true,
    });
    // publish on the next frame so this effect only subscribes, never re-renders synchronously
    const raf = requestAnimationFrame(() => setLenis(instance));

    return () => {
      cancelAnimationFrame(raf);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  // New page: re-measure the document so the scroll limit matches the new content.
  const onRoute = useCallback(() => lenis?.resize(), [lenis]);

  return (
    <LenisContext.Provider value={lenis}>
      <RouteWatcher onChange={onRoute} />
      {children}
    </LenisContext.Provider>
  );
}
