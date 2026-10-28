"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { themeForPath, type ThemeName } from "@/lib/theme";
import { useCurtain } from "./Curtain";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  /** Theme of the destination. Defaults to what the URL implies (collections only). */
  theme?: ThemeName;
};

/**
 * A normal link (crawlable, works without JS, opens in a new tab with
 * Ctrl/Cmd-click) that plays the curtain transition on a plain click.
 */
export function CollectionLink({ href, theme, onClick, ...rest }: Props) {
  const curtain = useCurtain();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (
      !curtain ||
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      rest.target === "_blank"
    ) {
      return;
    }
    e.preventDefault();
    curtain.go(href, theme ?? themeForPath(href));
  }

  return <Link href={href} onClick={handleClick} {...rest} />;
}
