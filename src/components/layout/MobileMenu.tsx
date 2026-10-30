"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { Drawer } from "@/components/ui/Dialog";
import { IconButton } from "@/components/ui/IconButton";
import { MenuIcon } from "@/components/ui/icons";
import { COLLECTIONS } from "@/lib/collections";
import { THEMES } from "@/lib/theme";
import { CollectionLink } from "./CollectionLink";
import { RouteWatcher } from "./RouteWatcher";

const LINKS = [
  ["Drops", "/drops"],
  ["Lookbook", "/lookbook"],
  ["About", "/about"],
  ["Contact", "/contact"],
  ["Account", "/account"],
  ["Wishlist", "/wishlist"],
  ["Track an order", "/track"],
] as const;

/** Phone menu: the four wardrobes as big tiles first, then everything else. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const lastPath = useRef<string | null>(null);
  const onRoute = useCallback((path: string) => {
    if (lastPath.current !== null && lastPath.current !== path) setOpen(false);
    lastPath.current = path;
  }, []);

  return (
    <>
      <RouteWatcher onChange={onRoute} />
      <Drawer
        title="Menu"
        side="left"
        open={open}
        onOpenChange={setOpen}
        trigger={<IconButton label="Open menu" icon={<MenuIcon />} className="-ml-2.5" />}
        className="max-w-none sm:max-w-md"
      >
        <nav aria-label="Main" className="flex flex-col gap-8">
          <ul className="grid grid-cols-2 gap-3">
            {COLLECTIONS.map((c) => {
              const t = THEMES[c.theme];
              return (
                <li key={c.slug}>
                  <CollectionLink
                    href={c.href}
                    onClick={() => setOpen(false)}
                    className="flex aspect-[4/5] flex-col justify-between p-4"
                    style={{
                      backgroundColor: t.background,
                      color: t.foreground,
                      backgroundImage: `radial-gradient(120% 80% at 80% 0%, ${t.accent}55 0%, transparent 60%)`,
                      boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.06)",
                    }}
                  >
                    <span
                      className="font-mono text-caption02 uppercase"
                      style={{ color: t.accent }}
                    >
                      {c.number}
                    </span>
                    <span className="font-display text-body02 font-bold">{c.name}</span>
                  </CollectionLink>
                </li>
              );
            })}
          </ul>
          <ul className="flex flex-col border-t border-border">
            <li>
              <Link
                href="/shop"
                onClick={() => setOpen(false)}
                className="flex min-h-14 items-center border-b border-border font-display text-heading03 font-bold"
              >
                Shop all
              </Link>
            </li>
            {LINKS.map(([label, href]) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center border-b border-border font-mono text-caption01 uppercase transition-colors duration-150 hover:text-accent"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Drawer>
    </>
  );
}
