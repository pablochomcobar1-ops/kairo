"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Saved pieces, by product slug. Guests keep them in this browser; once signed
 * in they are merged into the account (wishlist_items) and follow the shopper
 * to other devices. Signing out clears this browser's copy.
 */

export const MAX_WISHLIST = 100;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const isSlug = (v: unknown): v is string =>
  typeof v === "string" && v.length <= 120 && SLUG.test(v);

interface WishlistState {
  slugs: string[];
  toggle: (slug: string) => boolean;
  replace: (slugs: string[]) => void;
  clear: () => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      slugs: [],
      /** returns true when the piece is now saved */
      toggle: (slug) => {
        if (!isSlug(slug)) return false;
        const has = get().slugs.includes(slug);
        set({
          slugs: has
            ? get().slugs.filter((s) => s !== slug)
            : [slug, ...get().slugs].slice(0, MAX_WISHLIST),
        });
        return !has;
      },
      replace: (slugs) => set({ slugs: [...new Set(slugs.filter(isSlug))].slice(0, MAX_WISHLIST) }),
      clear: () => set({ slugs: [] }),
    }),
    {
      name: "kairo-wishlist-v1",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ slugs: s.slugs }),
      skipHydration: true,
      merge: (persisted, current) => {
        const slugs = (persisted as { slugs?: unknown } | undefined)?.slugs;
        return {
          ...current,
          slugs: Array.isArray(slugs)
            ? [...new Set(slugs.filter(isSlug))].slice(0, MAX_WISHLIST)
            : [],
        };
      },
    },
  ),
);
