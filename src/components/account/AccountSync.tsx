"use client";

import { useCallback, useEffect, useRef } from "react";
import { RouteWatcher } from "@/components/layout/RouteWatcher";
import { syncWishlist } from "@/server/actions/wishlist";
import { useUi } from "@/stores/ui";
import { useWishlist } from "@/stores/wishlist";

const AUTH_PAGES = /^\/(login|signup|reset-password|forgot-password|auth)(\/|$)/;

/**
 * Invisible. Loads the saved wishlist from this browser, then asks the server
 * whether someone is signed in (the session cookie is httpOnly, so the page
 * itself can't see it). It asks once after the page is idle, again when you
 * leave a sign-in page or open your account, and when the tab comes back after
 * a while. On sign-in the browser's list is merged into the account; when the
 * session ends, this browser's copy is cleared.
 */
export function AccountSync() {
  const setSignedIn = useUi((s) => s.setSignedIn);
  const lastPath = useRef<string | null>(null);
  const lastCheck = useRef(0);
  const busy = useRef(false);

  const check = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    lastCheck.current = Date.now();
    try {
      const wasSignedIn = useUi.getState().signedIn === true;
      const r = await syncWishlist(useWishlist.getState().slugs);
      if (r.signedIn) useWishlist.getState().replace(r.slugs);
      else if (wasSignedIn) useWishlist.getState().clear();
      setSignedIn(r.signedIn);
    } catch {
      // offline or server hiccup: keep what we know
    } finally {
      busy.current = false;
    }
  }, [setSignedIn]);

  useEffect(() => {
    void useWishlist.persist.rehydrate();
    const onStorage = (e: StorageEvent) => {
      if (e.key === useWishlist.persist.getOptions().name) void useWishlist.persist.rehydrate();
    };
    const onFocus = () => {
      if (document.visibilityState === "visible" && Date.now() - lastCheck.current > 5 * 60_000)
        void check();
    };
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onFocus);

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setSignedIn(false);
    } else {
      const idle =
        "requestIdleCallback" in window
          ? window.requestIdleCallback
          : (cb: () => void) => window.setTimeout(cb, 300);
      idle(() => void check());
    }
    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [check, setSignedIn]);

  const onRoute = useCallback(
    (path: string) => {
      const prev = lastPath.current;
      lastPath.current = path;
      if (prev === null || !process.env.NEXT_PUBLIC_SUPABASE_URL) return; // first load is handled above
      if (
        (AUTH_PAGES.test(prev) && !AUTH_PAGES.test(path)) ||
        (path.startsWith("/account") && useUi.getState().signedIn !== true)
      ) {
        void check();
      }
    },
    [check],
  );

  return <RouteWatcher onChange={onRoute} />;
}
