"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useReducedMotion } from "@/components/motion/useReducedMotion";
import { useRef } from "react";
import Link from "next/link";

const SENTENCE =
  "Every piece is cut, stitched and finished within a few kilometres of the old city — by people who have done it for thirty years, for a city that dresses for four different lives.";

function Word({
  word,
  i,
  n,
  progress,
}: {
  word: string;
  i: number;
  n: number;
  progress: MotionValue<number>;
}) {
  const opacity = useTransform(progress, [i / n, Math.min(1, (i + 1.5) / n)], [0.16, 1]);
  return (
    <>
      <motion.span style={{ opacity }}>{word}</motion.span>{" "}
    </>
  );
}

/** An arched window with a stone lattice, Ahmedabad style. Stand-in until the photo. */
function Jaali() {
  return (
    <svg
      viewBox="0 0 400 520"
      className="size-full"
      role="img"
      aria-label="Illustration: an arched stone lattice window, as found in Ahmedabad's old city"
    >
      <defs>
        <pattern id="jaali" width="40" height="40" patternUnits="userSpaceOnUse">
          <path
            d="M20 0 L40 20 L20 40 L0 20 Z"
            fill="none"
            stroke="var(--k-accent)"
            strokeWidth="1.3"
          />
          <circle cx="20" cy="20" r="6" fill="none" stroke="var(--k-accent)" strokeWidth="1" />
          <circle cx="0" cy="0" r="3" fill="var(--k-accent)" opacity="0.6" />
          <circle cx="40" cy="40" r="3" fill="var(--k-accent)" opacity="0.6" />
        </pattern>
        <radialGradient id="jaali-light" cx="50%" cy="35%" r="65%">
          <stop offset="0" stopColor="var(--k-accent)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--k-accent)" stopOpacity="0" />
        </radialGradient>
        <clipPath id="arch">
          <path d="M40 520 L40 210 C40 90 120 30 200 30 C280 30 360 90 360 210 L360 520 Z" />
        </clipPath>
      </defs>
      <rect width="400" height="520" fill="var(--k-bg-2)" />
      <g clipPath="url(#arch)">
        <rect width="400" height="520" fill="url(#jaali-light)" />
        <rect width="400" height="520" fill="url(#jaali)" opacity="0.8" />
      </g>
      <path
        d="M40 520 L40 210 C40 90 120 30 200 30 C280 30 360 90 360 210 L360 520"
        fill="none"
        stroke="var(--k-accent)"
        strokeWidth="2"
      />
      <path
        d="M58 520 L58 212 C58 104 130 48 200 48 C270 48 342 104 342 212 L342 520"
        fill="none"
        stroke="var(--k-accent)"
        strokeOpacity="0.5"
      />
    </svg>
  );
}

/**
 * 7 · Ahmedabad story. The image drifts slower than the page (parallax) and the
 * sentence lights up word by word as you scroll. Reduced motion: both still.
 */
export function StorySection() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const { scrollYProgress: textProgress } = useScroll({
    target: ref,
    offset: ["start 0.75", "center 0.45"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const words = SENTENCE.split(" ");

  return (
    <section ref={ref} aria-labelledby="story-title" className="px-gutter py-section">
      <div className="mx-auto grid max-w-site items-center gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
        <div className="relative aspect-[4/5] overflow-hidden">
          <motion.div
            className="absolute inset-x-0 -inset-y-[10%]"
            style={reduce ? undefined : { y }}
          >
            <Jaali />
          </motion.div>
        </div>
        <div className="flex flex-col gap-8">
          <p
            id="story-title"
            className="font-mono text-caption01 tracking-[0.2em] text-accent uppercase"
          >
            Cut in Ahmedabad
          </p>
          <p className="font-display text-heading01 leading-[1.25] font-bold">
            {reduce
              ? SENTENCE
              : words.map((w, i) => (
                  <Word key={i} word={w} i={i} n={words.length} progress={textProgress} />
                ))}
          </p>
          <Link
            href="/about"
            className="self-start font-mono text-caption01 tracking-[0.14em] text-foreground-secondary uppercase underline-offset-4 hover:text-foreground hover:underline"
          >
            Our story →
          </Link>
        </div>
      </div>
    </section>
  );
}
