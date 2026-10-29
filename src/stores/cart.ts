"use client";

import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { clampQty } from "@/lib/pricing";

/**
 * The bag, kept in the browser (localStorage) so it survives reloads and works
 * for guests. `unitPaise` is only for showing a price in the drawer: at
 * checkout the server ignores it and charges the database price (Task 9).
 */

const lineSchema = z.object({
  variantId: z.string().min(1).max(64),
  productSlug: z.string().min(1).max(120),
  name: z.string().min(1).max(120),
  size: z.string().min(1).max(8),
  colour: z.string().min(1).max(40),
  image: z.string().max(300).nullable(),
  unitPaise: z.number().int().positive(),
  qty: z.number().int().min(1).max(5),
});

export type CartLine = z.infer<typeof lineSchema>;

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
      // Whatever is in storage was written by a browser; check it before trusting it.
      merge: (persisted, current) => {
        const parsed = z.object({ lines: z.array(lineSchema).max(50) }).safeParse(persisted);
        return { ...current, lines: parsed.success ? parsed.data.lines : [] };
      },
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.qty, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((sum, l) => sum + l.unitPaise * l.qty, 0);
