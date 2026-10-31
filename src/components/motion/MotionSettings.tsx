"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/** Site-wide: when the visitor asks for reduced motion, movement and scaling are instant (fades stay). */
export function MotionSettings({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
