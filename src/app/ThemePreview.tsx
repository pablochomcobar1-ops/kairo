"use client";

import { useEffect, useState } from "react";

const THEMES = [
  { id: "noir", label: "Noir" },
  { id: "street", label: "Streetwear" },
  { id: "formal", label: "Formal" },
  { id: "old-money", label: "Old Money" },
  { id: "riding", label: "Riding" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

/**
 * Temporary Task 0 check: flips data-theme on <html> so every token can be
 * seen tweening. Replaced by the real ThemeController in Task 2.
 */
export function ThemePreview() {
  const [active, setActive] = useState<ThemeId>("noir");

  // Sync the chosen theme onto <html>; the token transitions do the rest.
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", active);
  }, [active]);

  function pick(id: ThemeId) {
    setActive(id);
  }

  return (
    <div role="group" aria-label="Preview collection themes" className="flex flex-wrap gap-3">
      {THEMES.map((t) => (
        <button
          key={t.id}
          type="button"
          aria-pressed={active === t.id}
          onClick={() => pick(t.id)}
          className={[
            "min-h-11 border px-5 font-mono text-caption01 uppercase",
            "transition-colors duration-300",
            active === t.id
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border-strong text-foreground hover:border-accent",
          ].join(" ")}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
