"use client";

import { create } from "zustand";

/** Site chrome state shared between the header, menus and the cart drawer. Not saved. */
interface UiState {
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  /** How many hero sections are on screen; the header goes transparent over them. */
  heroCount: number;
  heroMounted: () => () => void;
}

export const useUi = create<UiState>()((set) => ({
  cartOpen: false,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  heroCount: 0,
  heroMounted: () => {
    set((s) => ({ heroCount: s.heroCount + 1 }));
    return () => set((s) => ({ heroCount: Math.max(0, s.heroCount - 1) }));
  },
}));
