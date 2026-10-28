import type { ThemeName } from "@/lib/theme";
import { ThemeSignal } from "./ThemeSignal";

/**
 * Puts the page in a collection theme. Renders a hidden marker that
 * `:root:has([data-page-theme])` in tokens.css picks up, so the theme is
 * right in the server HTML (no flash) and follows back/forward navigation.
 * Pages without one stay Noir.
 */
export function PageTheme({ theme }: { theme: ThemeName }) {
  return (
    <>
      <span hidden data-page-theme={theme} />
      <ThemeSignal theme={theme} />
    </>
  );
}
