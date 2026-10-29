"use client";

import { useEffect } from "react";
import { useUi } from "@/stores/ui";

/**
 * Put this inside a full-bleed hero that starts at the very top of the page
 * (and pull the hero up under the header with `-mt-(--header-h)`).
 * While it is on screen the header stays transparent until you scroll.
 */
export function HeroMarker() {
  const heroMounted = useUi((s) => s.heroMounted);
  useEffect(() => heroMounted(), [heroMounted]);
  return null;
}
