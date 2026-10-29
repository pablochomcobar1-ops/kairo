/**
 * The still silk: what the hero shows before WebGL loads, without WebGL,
 * under reduced motion or data saver. Pure SVG coloured by the theme, so it
 * is in the server HTML and never leaves a blank box.
 */
export function SilkFallback({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Dark silk fabric with soft folds catching a warm light"
    >
      <defs>
        <linearGradient id="silk-fold" x1="0" y1="0" x2="1" y2="0.6">
          <stop offset="0" stopColor="var(--color-background)" />
          <stop offset="0.45" stopColor="color-mix(in oklab, var(--color-accent) 18%, var(--color-background-tertiary))" />
          <stop offset="0.62" stopColor="var(--color-background-secondary)" />
          <stop offset="1" stopColor="var(--color-background)" />
        </linearGradient>
        <linearGradient id="silk-edge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--color-accent)" stopOpacity="0" />
          <stop offset="0.5" stopColor="var(--color-accent)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="silk-glow" cx="0.55" cy="0.42" r="0.6">
          <stop offset="0" stopColor="color-mix(in oklab, var(--color-accent) 30%, var(--color-background))" stopOpacity="0.5" />
          <stop offset="1" stopColor="var(--color-background)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1440" height="900" fill="var(--color-background)" />
      <rect width="1440" height="900" fill="url(#silk-glow)" />
      <path d="M0 520 C 260 360, 520 680, 800 500 S 1240 320, 1440 430 L 1440 900 L 0 900 Z" fill="url(#silk-fold)" />
      <path d="M0 600 C 300 450, 560 740, 860 580 S 1260 410, 1440 520 L 1440 900 L 0 900 Z" fill="url(#silk-fold)" opacity="0.85" />
      <path d="M0 700 C 340 560, 600 800, 900 680 S 1280 540, 1440 620 L 1440 900 L 0 900 Z" fill="url(#silk-fold)" opacity="0.7" />
      <path d="M0 520 C 260 360, 520 680, 800 500 S 1240 320, 1440 430" fill="none" stroke="url(#silk-edge)" strokeWidth="1.5" />
      <path d="M0 600 C 300 450, 560 740, 860 580 S 1260 410, 1440 520" fill="none" stroke="url(#silk-edge)" strokeWidth="1" />
    </svg>
  );
}
