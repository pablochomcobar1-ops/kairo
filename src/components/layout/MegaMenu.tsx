"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { COLLECTIONS } from "@/lib/collections";
import { THEMES } from "@/lib/theme";
import { ChevronDownIcon } from "@/components/ui/icons";
import { CollectionLink } from "./CollectionLink";
import { RouteWatcher } from "./RouteWatcher";

const OPEN_DELAY = 120; // a mouse passing over "Shop" shouldn't open it
const CLOSE_DELAY = 220; // moving diagonally into the panel shouldn't close it

/**
 * Desktop "Shop" menu: the four wardrobes as mood tiles, plus quick links.
 * A disclosure, not an ARIA menu: Tab moves through the links like any page.
 * Opens on hover (with intent delay) or click/Enter; Escape closes and returns focus.
 */
export function MegaMenu() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);

  const schedule = useCallback((next: boolean, delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(next), delay);
  }, []);

  // Close whenever the page changes.
  const lastPath = useRef<string | null>(null);
  const onRoute = useCallback((path: string) => {
    if (lastPath.current !== null && lastPath.current !== path) setOpen(false);
    lastPath.current = path;
  }, []);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      onPointerEnter={(e) => e.pointerType === "mouse" && schedule(true, OPEN_DELAY)}
      onPointerLeave={(e) => e.pointerType === "mouse" && schedule(false, CLOSE_DELAY)}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <RouteWatcher onChange={onRoute} />
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          window.clearTimeout(timer.current);
          setOpen((o) => !o);
        }}
        className="group inline-flex h-11 items-center gap-1.5 font-mono text-caption01 uppercase transition-colors duration-150 hover:text-accent aria-expanded:text-accent"
      >
        Shop
        <ChevronDownIcon
          size={14}
          className="transition-transform duration-200 ease-ui group-aria-expanded:rotate-180"
        />
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full border-y border-border bg-background-secondary/95 backdrop-blur-xl motion-safe:animate-[mega-in_220ms_var(--ease-ui)]"
      >
        <div className="mx-auto grid max-w-site grid-cols-[repeat(4,minmax(0,1fr))_14rem] gap-4 px-gutter py-8">
          {COLLECTIONS.map((c) => {
            const t = THEMES[c.theme];
            return (
              <CollectionLink
                key={c.slug}
                href={c.href}
                className="group relative flex aspect-[4/5] flex-col justify-between overflow-hidden p-5 outline-offset-4"
                style={{ backgroundColor: t.background, color: t.foreground }}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(120% 80% at 80% 0%, ${t.accent}55 0%, transparent 60%)`,
                  }}
                />
                <span
                  className="relative font-mono text-caption02 uppercase"
                  style={{ color: t.accent }}
                >
                  {c.number} · {c.mood}
                </span>
                <span className="relative flex flex-col gap-2">
                  <span className="font-display text-heading03 font-bold">{c.name}</span>
                  <span className="text-body02 opacity-80">{c.tagline}</span>
                </span>
              </CollectionLink>
            );
          })}
          <ul className="flex flex-col justify-end gap-1 border-l border-border pl-6">
            {[
              ["New in", "/shop?sort=new"],
              ["Shop all", "/shop"],
              ["Drops", "/drops"],
              ["Size guide", "/size-guide"],
            ].map(([label, href]) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex min-h-11 items-center font-mono text-caption01 uppercase transition-colors duration-150 hover:text-accent"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
