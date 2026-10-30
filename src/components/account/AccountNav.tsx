"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { signOut } from "@/server/actions/auth";
import { useUi } from "@/stores/ui";
import { useWishlist } from "@/stores/wishlist";

const LINKS = [
  { href: "/account", label: "Overview" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/wishlist", label: "Wishlist" },
];

/** Account menu: a column on desktop, a scrollable row on phones. */
export function AccountNav() {
  return <AccountNavLinks path={usePathname()} />;
}

/** The menu itself; `path` marks the current page (empty while loading). */
export function AccountNavLinks({ path }: { path: string }) {
  return (
    <nav aria-label="Account" className="md:sticky md:top-24 md:self-start">
      <ul className="-mx-gutter flex gap-1 overflow-x-auto px-gutter md:mx-0 md:flex-col md:px-0">
        {LINKS.map((l) => {
          const on =
            l.href === "/account"
              ? path === "/account" || path.startsWith("/account/orders")
              : path.startsWith(l.href);
          return (
            <li key={l.href} className="shrink-0">
              <Link
                href={l.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center border-b-2 px-3 font-mono text-caption01 tracking-[0.14em] uppercase transition-colors md:border-b-0 md:border-l-2",
                  on
                    ? "border-accent text-foreground"
                    : "border-transparent text-foreground-secondary hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 md:mt-4">
          <form
            action={signOut}
            onSubmit={() => {
              // this browser forgets the account's saved pieces at once
              useWishlist.getState().clear();
              useUi.getState().setSignedIn(false);
            }}
          >
            <button
              type="submit"
              className="flex min-h-11 items-center px-3 font-mono text-caption01 tracking-[0.14em] text-foreground-subtle uppercase transition-colors hover:text-accent md:border-l-2 md:border-transparent"
            >
              Sign out
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
