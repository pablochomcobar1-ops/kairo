"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { Fragment, useState } from "react";
import { cn } from "@/lib/cn";
import { EASE, themeTiming } from "./presets";

type Props = {
  /** The words to reveal. Use "\n" to force a line break. */
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  delay?: number;
  /** Animate on mount (hero) instead of when scrolled into view. */
  immediate?: boolean;
};

/**
 * Headline whose words rise from behind a mask, one after another.
 * Screen readers get the whole sentence once (the animated words are hidden from them).
 */
export function SplitText({ text, as = "h2", className, delay = 0, immediate = false }: Props) {
  const reduce = useReducedMotion();
  const [timing] = useState(themeTiming);
  const Tag = as;
  const lines = text.split("\n");
  let index = 0;

  const show = { transform: "translateY(0%)", opacity: 1 };
  const hidden = reduce ? { opacity: 0 } : { transform: "translateY(105%)", opacity: 1 };

  return (
    <Tag className={className} aria-label={text.replace(/\n/g, " ")}>
      {lines.map((line, li) => (
        <span key={li} aria-hidden="true" className="block">
          {line.split(" ").map((word, wi) => {
            const i = index++;
            return (
              <Fragment key={wi}>
                <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                  <motion.span
                    className={cn("inline-block will-change-transform")}
                    initial={hidden}
                    {...(immediate
                      ? { animate: show }
                      : { whileInView: show, viewport: { once: true } })}
                    transition={{
                      duration: reduce ? 0.2 : timing.reveal,
                      delay: delay + (reduce ? 0 : i * timing.stagger),
                      ease: EASE.expo,
                    }}
                  >
                    {word}
                  </motion.span>
                </span>
                {/* the space sits outside the masked box, or it collapses */}
                {wi < line.split(" ").length - 1 ? " " : null}
              </Fragment>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}
