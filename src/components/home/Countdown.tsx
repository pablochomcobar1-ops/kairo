"use client";

import { AnimatePresence, motion } from "motion/react";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { useEffect, useState } from "react";
import { timeLeft, type TimeLeft } from "@/lib/countdown";
import { cn } from "@/lib/cn";

function Digit({ value }: { value: string }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden text-center leading-none">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          className="absolute inset-0"
          initial={reduce ? { opacity: 0 } : { y: "-100%", rotateX: 70, opacity: 0 }}
          animate={{ y: "0%", rotateX: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: "100%", rotateX: -70, opacity: 0 }}
          transition={{ duration: reduce ? 0.15 : 0.42, ease: [0.23, 1, 0.32, 1] }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Unit({ value, label, small }: { value: number | null; label: string; small?: boolean }) {
  const text = value == null ? "--" : String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-start gap-2">
      <span
        className={cn(
          "font-mono leading-none font-medium tabular-nums",
          small ? "text-[clamp(2rem,6vw,2.75rem)]" : "text-[clamp(2.75rem,8vw,6rem)]",
        )}
        aria-hidden="true"
      >
        {text.split("").map((d, i) => (
          <Digit key={i} value={d} />
        ))}
      </span>
      <span
        className="font-mono text-caption02 tracking-[0.18em] text-foreground-subtle uppercase"
        aria-hidden="true"
      >
        {label}
      </span>
    </div>
  );
}

/**
 * Live countdown with flipping digits. The server sends only the target time;
 * the numbers appear after the page loads (so server and browser never disagree).
 * Screen readers get one sentence that updates once a minute, not every second.
 */
export function Countdown({
  target,
  onDone,
  className,
  size = "lg",
}: {
  target: string;
  onDone?: () => void;
  className?: string;
  size?: "lg" | "sm";
}) {
  const [left, setLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const t = new Date(target);
    let id = 0;
    const tick = () => {
      const next = timeLeft(t, new Date());
      setLeft(next);
      if (next.done) {
        onDone?.();
        return;
      }
      // line up with the next whole second
      id = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 5);
    };
    tick();
    return () => window.clearTimeout(id);
  }, [target, onDone]);

  const spoken = left
    ? left.done
      ? "The drop is live."
      : `${left.days} days, ${left.hours} hours and ${left.minutes} minutes to go.`
    : "";

  if (left?.done) {
    return (
      <p className={cn("font-display text-heading01 font-bold text-accent", className)}>Live now</p>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        className={cn("flex", size === "sm" ? "gap-5" : "gap-5 md:gap-10")}
        role="timer"
        aria-label="Time until the drop"
      >
        <Unit value={left?.days ?? null} label="Days" small={size === "sm"} />
        <Unit value={left?.hours ?? null} label="Hours" small={size === "sm"} />
        <Unit value={left?.minutes ?? null} label="Min" small={size === "sm"} />
        <Unit value={left?.seconds ?? null} label="Sec" small={size === "sm"} />
      </div>
      <p className="sr-only">{spoken}</p>
    </div>
  );
}
