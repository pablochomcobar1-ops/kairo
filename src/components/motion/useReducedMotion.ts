"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

// some environments (tests, very old browsers) have no matchMedia
const supported = () => typeof window !== "undefined" && typeof window.matchMedia === "function";

function subscribe(onChange: () => void) {
  if (!supported()) return () => {};
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * The visitor's "reduce motion" setting, safe to use in server-rendered
 * components: it reads `false` during the first render (like the server,
 * which can't know), then the real value right after. Using motion's own
 * hook made the browser's first render differ from the server HTML for
 * these visitors (a hydration mismatch on every page). MotionConfig
 * reducedMotion="user" in the root keeps their movement instant meanwhile.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => supported() && window.matchMedia(QUERY).matches,
    () => false,
  );
}
