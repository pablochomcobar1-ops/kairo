"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { CollectionLink } from "@/components/layout/CollectionLink";
import { RouteWatcher } from "@/components/layout/RouteWatcher";
import { buttonClasses } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Dialog";
import { COLLECTIONS } from "@/lib/collections";
import { formatINR } from "@/lib/money";
import { freeShippingProgress } from "@/lib/pricing";
import { cartCount, cartSubtotal, useCart } from "@/stores/cart";
import { useUi } from "@/stores/ui";
import { CartLineItem } from "./CartLine";

/** Loads the saved bag once the page is interactive (see skipHydration in the store). */
function useHydrateCart() {
  useEffect(() => {
    void useCart.persist.rehydrate();
    // keep tabs in sync: adding in one tab updates the other
    function onStorage(e: StorageEvent) {
      if (e.key === useCart.persist.getOptions().name) void useCart.persist.rehydrate();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
}

export function CartDrawer() {
  useHydrateCart();
  const open = useUi((s) => s.cartOpen);
  const setOpen = useUi((s) => s.setCartOpen);
  const lines = useCart((s) => s.lines);
  const reduce = useReducedMotion();
  const count = cartCount(lines);
  const subtotal = cartSubtotal(lines);
  const shipping = freeShippingProgress(subtotal);

  // close when the page changes (e.g. after tapping a product in the bag)
  const lastPath = useRef<string | null>(null);
  const onRoute = useCallback(
    (path: string) => {
      if (lastPath.current !== null && lastPath.current !== path) setOpen(false);
      lastPath.current = path;
    },
    [setOpen],
  );

  return (
    <>
      <RouteWatcher onChange={onRoute} />
      <Drawer
        title={count ? `Your bag (${count})` : "Your bag"}
        description="Items in your bag, quantities and subtotal"
        open={open}
        onOpenChange={setOpen}
        footer={
          lines.length > 0 ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-caption01 text-foreground-secondary uppercase">
                  Subtotal
                </span>
                <span className="font-mono text-heading03 tabular-nums">{formatINR(subtotal)}</span>
              </div>
              <p className="text-body02 text-foreground-subtle">
                Shipping and any coupon are worked out at checkout.
              </p>
              <Link
                href="/checkout"
                className={buttonClasses("primary", "lg", "w-full")}
                onClick={() => setOpen(false)}
              >
                Checkout
              </Link>
            </div>
          ) : undefined
        }
      >
        {lines.length === 0 ? (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <p className="font-display text-heading03 font-bold">Nothing in here yet.</p>
              <p className="text-body02 text-foreground-secondary">Pick a wardrobe to start.</p>
            </div>
            <ul className="flex flex-col border-t border-border">
              {COLLECTIONS.map((c) => (
                <li key={c.slug}>
                  <CollectionLink
                    href={c.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-14 items-center justify-between border-b border-border font-mono text-caption01 uppercase transition-colors duration-150 hover:text-accent"
                  >
                    <span>{c.name}</span>
                    <span aria-hidden="true">→</span>
                  </CollectionLink>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2" role="status">
              <p className="text-body02">
                {shipping.unlocked ? (
                  <>You&apos;ve unlocked free shipping.</>
                ) : (
                  <>
                    Add{" "}
                    <span className="font-mono text-accent">
                      {formatINR(shipping.remainingPaise)}
                    </span>{" "}
                    more for free shipping.
                  </>
                )}
              </p>
              <div className="h-0.5 w-full bg-border" aria-hidden="true">
                <div
                  className="h-full origin-left bg-accent transition-transform duration-500 ease-ui"
                  style={{ transform: `scaleX(${shipping.ratio})` }}
                />
              </div>
            </div>

            <ul className="flex flex-col">
              <AnimatePresence initial={false}>
                {lines.map((line) => (
                  <motion.li
                    key={line.variantId}
                    layout={!reduce}
                    initial={
                      reduce ? { opacity: 0 } : { opacity: 0, transform: "translateX(16px)" }
                    }
                    animate={reduce ? { opacity: 1 } : { opacity: 1, transform: "translateX(0px)" }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
                    className="border-b border-border py-5 first:pt-0"
                  >
                    <CartLineItem line={line} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        )}
      </Drawer>
    </>
  );
}
