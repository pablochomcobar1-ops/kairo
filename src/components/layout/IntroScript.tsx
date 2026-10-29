"use client";

import { INTRO_SCRIPT } from "./Loader";

/**
 * The tiny script that decides, before first paint, whether the intro plays.
 * It must run from the server HTML. When React later renders the root layout
 * in the browser (error and not-found pages do this), a plain <script> makes
 * React log "Encountered a script tag…". In the browser we therefore label it
 * as data, which React accepts silently; the browser never re-runs it anyway.
 */
export function IntroScript() {
  const inBrowser = typeof window !== "undefined";
  return (
    <script
      suppressHydrationWarning
      type={inBrowser ? "application/json" : undefined}
      dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }}
    />
  );
}
