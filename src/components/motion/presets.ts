/**
 * Motion presets. Durations that depend on the collection (how slow Old Money
 * feels vs. how fast Riding feels) come from CSS variables in tokens.css, so
 * every reveal automatically matches the current theme.
 */

export const EASE = {
  /** anything the user triggers */
  ui: [0.23, 1, 0.32, 1],
  /** long cinematic reveals */
  expo: [0.16, 1, 0.3, 1],
  /** on-screen movement */
  cine: [0.65, 0, 0.35, 1],
  /** sheets and drawers */
  drawer: [0.32, 0.72, 0, 1],
} as const satisfies Record<string, [number, number, number, number]>;

/** Reads a CSS time variable ("900ms" / "0.9s") from <html> as seconds. */
export function cssSeconds(name: string, fallbackSeconds: number): number {
  if (typeof window === "undefined") return fallbackSeconds;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw) return fallbackSeconds;
  const value = parseFloat(raw);
  if (Number.isNaN(value)) return fallbackSeconds;
  return raw.endsWith("ms") ? value / 1000 : value;
}

/** The current theme's reveal duration and stagger, in seconds. */
export function themeTiming() {
  return {
    reveal: cssSeconds("--k-dur-reveal", 0.9),
    stagger: cssSeconds("--k-stagger", 0.09),
  };
}
