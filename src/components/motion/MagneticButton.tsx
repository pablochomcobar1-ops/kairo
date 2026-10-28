"use client";

import { motion, useReducedMotion, useSpring } from "motion/react";
import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

/**
 * Wraps a button or link so it leans toward the cursor (desktop mouse only).
 * Spring-driven so it settles naturally; capped at a few pixels so it reads
 * as polish, not a gimmick. Off for touch screens and reduced motion.
 */
export function MagneticButton({
  children,
  strength = 0.25,
  max = 10,
  className,
}: {
  children: ReactNode;
  strength?: number;
  max?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [finePointer, setFinePointer] = useState(false);
  const x = useSpring(0, { stiffness: 220, damping: 18, mass: 0.6 });
  const y = useSpring(0, { stiffness: 220, damping: 18, mass: 0.6 });

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFinePointer(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const active = finePointer && !reduce;

  function onMove(e: PointerEvent<HTMLDivElement>) {
    if (!active || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const clamp = (v: number) => Math.max(-max, Math.min(max, v));
    x.set(clamp((e.clientX - (r.left + r.width / 2)) * strength));
    y.set(clamp((e.clientY - (r.top + r.height / 2)) * strength));
  }

  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      ref={ref}
      className={className ?? "inline-block"}
      style={active ? { x, y } : undefined}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {children}
    </motion.div>
  );
}
