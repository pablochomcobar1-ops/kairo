"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { THEMES, type ThemeName } from "@/lib/theme";

/**
 * The curtain between collections (timings from the Stage 2 storyboard):
 *   0–400 ms   the next collection's colour wipes in, carrying its name
 *   400–600 ms the route changes underneath; colours, grain and silk swap
 *   600–900 ms the curtain lifts away and the new page's text rises
 * Reduced motion: a 200 ms crossfade, no wipe.
 * Back/forward navigation never shows the curtain; the theme just follows the page.
 */

type Phase = "idle" | "cover" | "hold" | "reveal";

interface CurtainState {
  phase: Phase;
  theme: ThemeName;
  target: string;
}

interface CurtainApi {
  /** Cover the screen in `theme`, navigate to `href`, then lift. */
  go: (href: string, theme: ThemeName) => void;
  busy: boolean;
}

const CurtainContext = createContext<CurtainApi | null>(null);

export function useCurtain(): CurtainApi | null {
  return useContext(CurtainContext);
}

const EASE_IN_OUT: [number, number, number, number] = [0.76, 0, 0.24, 1];
const HOLD_MS = 200; // lets the new page paint and the colours start swapping under the curtain
const SAFETY_MS = 4000; // never leave the curtain down if navigation stalls

function pathOf(href: string) {
  return href.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
}

export function CurtainProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const [state, setState] = useState<CurtainState>({ phase: "idle", theme: "noir", target: "" });
  const hrefRef = useRef("");

  const go = useCallback(
    (href: string, theme: ThemeName) => {
      if (pathOf(href) === pathOf(pathname)) return;
      hrefRef.current = href;
      setState((s) => (s.phase === "idle" ? { phase: "cover", theme, target: pathOf(href) } : s));
    },
    [pathname],
  );

  // Fully covered → navigate.
  const onCovered = useCallback(() => {
    setState((s) => (s.phase === "cover" ? { ...s, phase: "hold" } : s));
    router.push(hrefRef.current);
  }, [router]);

  // New route rendered → short hold → lift. A safety timer lifts it regardless.
  useEffect(() => {
    if (state.phase !== "hold") return;
    const arrived = pathOf(pathname) === state.target;
    const timer = window.setTimeout(
      () => setState((s) => (s.phase === "hold" ? { ...s, phase: "reveal" } : s)),
      arrived ? HOLD_MS : SAFETY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [state.phase, state.target, pathname]);

  const onLifted = useCallback(() => {
    setState((s) => (s.phase === "reveal" ? { ...s, phase: "idle" } : s));
  }, []);

  const api = useMemo<CurtainApi>(() => ({ go, busy: state.phase !== "idle" }), [go, state.phase]);
  const info = THEMES[state.theme];

  const wipe = {
    initial: { clipPath: "inset(0% 0% 0% 100%)" },
    cover: { clipPath: "inset(0% 0% 0% 0%)", transition: { duration: 0.4, ease: EASE_IN_OUT } },
    reveal: { clipPath: "inset(0% 100% 0% 0%)", transition: { duration: 0.3, ease: EASE_IN_OUT } },
  };
  const fade = {
    initial: { opacity: 0 },
    cover: { opacity: 1, transition: { duration: 0.1 } },
    reveal: { opacity: 0, transition: { duration: 0.1 } },
  };

  return (
    <CurtainContext.Provider value={api}>
      {children}
      <AnimatePresence>
        {state.phase !== "idle" && (
          <motion.div
            key="curtain"
            aria-hidden="true"
            data-testid="curtain"
            className="pointer-events-auto fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4"
            style={{ backgroundColor: info.background, color: info.foreground }}
            variants={reduceMotion ? fade : wipe}
            initial="initial"
            animate={state.phase === "reveal" ? "reveal" : "cover"}
            onAnimationComplete={(definition) => {
              if (definition === "cover" && state.phase === "cover") onCovered();
              if (definition === "reveal") onLifted();
            }}
          >
            {!reduceMotion && (
              <>
                <motion.span
                  className="font-mono text-caption01 uppercase"
                  style={{ color: info.accent }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.12, duration: 0.3 } }}
                >
                  {info.mood}
                </motion.span>
                <motion.span
                  className="font-display text-hero02 font-bold"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: 0.08, duration: 0.35, ease: EASE_IN_OUT } }}
                >
                  {info.label}
                </motion.span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </CurtainContext.Provider>
  );
}
