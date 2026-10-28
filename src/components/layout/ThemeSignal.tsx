"use client";

import { useEffect } from "react";
import type { ThemeName } from "@/lib/theme";

export const THEME_EVENT = "kairo:theme";

export type ThemeEvent = CustomEvent<{ theme: ThemeName }>;

/**
 * Which theme is on screen, once JavaScript is running.
 *
 * Next.js keeps recently visited pages mounted but hidden, so a CSS-only
 * check (`:has([data-page-theme])`) would also see hidden pages' markers.
 * React runs effects only for pages that are actually showing, so each
 * visible page registers its theme here and removes it when hidden.
 * The newest registration wins; with none, the site is Noir.
 */
const active: { id: number; theme: ThemeName }[] = [];
let nextId = 0;

function apply() {
  const theme = active.at(-1)?.theme ?? "noir";
  const root = document.documentElement;
  root.classList.add("js-theme");
  if (root.dataset.theme !== theme) {
    root.dataset.theme = theme;
    window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme } }));
  }
}

/** Register a theme as on screen. Returns the function that unregisters it. */
export function pushTheme(theme: ThemeName): () => void {
  const id = nextId++;
  active.push({ id, theme });
  apply();
  return () => {
    const i = active.findIndex((e) => e.id === id);
    if (i !== -1) active.splice(i, 1);
    apply();
  };
}

/** The theme currently applied to the page. */
export function currentTheme(): ThemeName {
  return active.at(-1)?.theme ?? "noir";
}

export function ThemeSignal({ theme }: { theme: ThemeName }) {
  useEffect(() => pushTheme(theme), [theme]);
  return null;
}
