"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { clampQty } from "@/lib/pricing";

/**
 * The bag, kept in the browser (localStorage) so it survives reloads and works
 * for guests. `unitPaise` is only for showing a price in the drawer: at
 * checkout the server ignores it and charges the database price (Task 9).
 */

export interface CartLine {
  variantId: string;
  productSlug: string;
  name: string;
  size: string;
  colour: string;
  image: string | null;
  unitPaise: number;
  qty: number;
}

const text = (v: unknown, max: number) => typeof v === "string" && v.length >= 1 && v.length <= max;

/** Whatever is in storage was written by a browser; check it before trusting it. (Plain checks: keeps a validation library out of every page.) */
export function isCartLine(v: unknown): v is CartLine {
  if (!v || typeof v !== "object") return false;
  const l = v as Record<string, unknown>;
  return (
    text(l.variantId, 64) &&
    text(l.productSlug, 120) &&
    text(l.name, 120) &&
    text(l.size, 8) &&
    text(l.colour, 40) &&
    (l.image === null || (typeof l.image === "string" && l.image.length <= 300)) &&
    Number.isInteger(l.unitPaise) &&
    (l.unitPaise as number) > 0 &&
    Number.isInteger(l.qty) &&
    (l.qty as number) >= 1 &&
    (l.qty as number) <= 5
  );
}

interface CartState {
  lines: CartLine[];
  add: (line: CartLine) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line) =>
        set((s) => {
          const existing = s.lines.find((l) => l.variantId === line.variantId);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.variantId === line.variantId ? { ...l, qty: clampQty(l.qty + clampQty(line.qty)) } : l,
              ),
            };
          }
          return { lines: [...s.lines, { ...line, qty: clampQty(line.qty) }] };
        }),
      setQty: (variantId, qty) =>
        set((s) => ({
          lines: s.lines.map((l) => (l.variantId === variantId ? { ...l, qty: clampQty(qty) } : l)),
        })),
      remove: (variantId) => set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId) })),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "kairo-cart-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }),
      // Read on the client after first paint (CartHydrator), so server HTML and
      // the first client render agree and React doesn't warn.
      skipHydration: true,
      merge: (persisted, current) => {
        const lines = (persisted as { lines?: unknown } | undefined)?.lines;
        const ok = Array.isArray(lines) && lines.length <= 50 && lines.every(isCartLine);
        return { ...current, lines: ok ? (lines as CartLine[]) : [] };
      },
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.unitPaise * l.qty, 0);
