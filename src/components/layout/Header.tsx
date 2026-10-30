"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { BagIcon, HeartIcon, SearchIcon, UserIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { cartCount, useCart } from "@/stores/cart";
import { useUi } from "@/stores/ui";
import { useWishlist } from "@/stores/wishlist";
import { Wordmark } from "./Logo";
import { MegaMenu } from "./MegaMenu";
import { MobileMenu } from "./MobileMenu";

const SOLID_AFTER = 80; // px scrolled before the header gets its background
const HIDE_AFTER = 240; // px scrolled before it can hide on the way down

const navLink =
  "inline-flex h-11 items-center font-mono text-caption01 uppercase transition-colors duration-150 hover:text-accent";

const iconLink =
  "inline-flex size-11 items-center justify-center text-foreground transition-[transform,color] duration-150 ease-ui hover:text-accent active:scale-[0.94]";

/**
 * Sticky header. Transparent while it sits over a hero, solid with a blur
 * once you scroll. Slides away as you scroll down and back as you scroll up,
 * but never while a menu inside it is open or something in it has focus.
 */
export function Header() {
  const overHero = useUi((s) => s.heroCount > 0);
  const setCartOpen = useUi((s) => s.setCartOpen);
  const count = useCart((s) => cartCount(s.lines));
  const saved = useWishlist((s) => s.slugs.length);
  const signedIn = useUi((s) => s.signedIn);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const y = window.scrollY;
        const busy =
          ref.current?.contains(document.activeElement) ||
          ref.current?.querySelector("[aria-expanded=true]");
        setScrolled(y > SOLID_AFTER);
        if (busy || y < HIDE_AFTER) setHidden(false);
        else if (Math.abs(y - lastY) > 6) setHidden(y > lastY);
        lastY = y;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const transparent = overHero && !scrolled;

  return (
    <header
      ref={ref}
      onFocusCapture={() => setHidden(false)}
      className={cn(
        "sticky top-0 z-50 h-(--header-h) border-b transition-[transform,background-color,border-color] duration-300 ease-ui",
        transparent
          ? "border-transparent bg-transparent"
          : "border-border bg-background/85 backdrop-blur-xl",
        hidden && "-translate-y-full",
      )}
    >
      <a
        href="#main"
        className="sr-only z-10 bg-foreground px-4 py-3 font-mono text-caption01 text-background uppercase focus:not-sr-only focus:absolute focus:top-2 focus:left-gutter"
      >
        Skip to content
      </a>
      <div className="mx-auto grid h-full max-w-site grid-cols-[1fr_auto_1fr] items-center px-gutter">
        {/* left */}
        <div className="flex items-center gap-7">
          <div className="lg:hidden">
            <MobileMenu />
          </div>
          <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
            <MegaMenu />
            <Link href="/drops" className={navLink}>
              Drops
            </Link>
            <Link href="/lookbook" className={navLink}>
              Lookbook
            </Link>
            <Link href="/about" className={navLink}>
              About
            </Link>
          </nav>
        </div>

        {/* centre */}
        <Link
          href="/"
          aria-label="KAIRO home"
          className="flex h-11 items-center px-2 text-heading03 sm:text-heading02"
        >
          <Wordmark />
        </Link>

        {/* right */}
        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
          <Link
            href="/search"
            aria-label="Search"
            className={cn(iconLink, "hidden sm:inline-flex")}
          >
            <SearchIcon />
          </Link>
          <Link
            href="/wishlist"
            aria-label={saved ? `Wishlist (${saved})` : "Wishlist"}
            className={cn(iconLink, "relative hidden sm:inline-flex")}
          >
            <HeartIcon filled={saved > 0} />
            {saved > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-1 right-1 flex min-w-4 items-center justify-center rounded-pill bg-accent px-1 font-mono text-[10px] leading-4 text-accent-foreground"
              >
                {saved > 9 ? "9+" : saved}
              </span>
            )}
          </Link>
          <Link
            href={signedIn ? "/account" : "/login"}
            aria-label={signedIn ? "Your account" : "Sign in"}
            className={cn(iconLink, "relative hidden lg:inline-flex")}
          >
            <UserIcon />
            {signedIn && (
              <span
                aria-hidden="true"
                className="absolute right-2.5 bottom-2.5 size-1.5 rounded-full bg-accent"
              />
            )}
          </Link>
          <IconButton
            label="Open bag"
            icon={<BagIcon />}
            count={count}
            onClick={() => setCartOpen(true)}
            className="-mr-2.5"
          />
        </div>
      </div>
    </header>
  );
}
