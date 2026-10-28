"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { EASE, themeTiming } from "./presets";

const tags = {
  div: motion.div,
  section: motion.section,
  li: motion.li,
  p: motion.p,
  span: motion.span,
  figure: motion.figure,
  article: motion.article,
} as const;

type Props = {
  as?: keyof typeof tags;
  children: ReactNode;
  className?: string;
  /** seconds before it starts */
  delay?: number;
  /** distance it rises, px */
  y?: number;
};

/**
 * Fades and rises in once when scrolled into view, at the current theme's speed.
 * Reduced motion: a short fade, no movement. Content is in the HTML from the
 * start, so search engines and no-JS visitors still get it.
 */
export function Reveal({ as = "div", children, className, delay = 0, y = 24 }: Props) {
  const reduce = useReducedMotion();
  const [timing] = useState(themeTiming);
  const Tag = tags[as];

  return (
    <Tag
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, transform: `translateY(${y}px)` }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, transform: "translateY(0px)" }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: reduce ? 0.2 : timing.reveal, delay, ease: EASE.expo }}
    >
      {children}
    </Tag>
  );
}
