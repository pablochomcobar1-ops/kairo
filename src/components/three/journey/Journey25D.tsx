"use client";

import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useEffect, useRef } from "react";
import { pushTheme } from "@/components/layout/ThemeSignal";
import { COLLECTIONS, type CollectionInfo } from "@/lib/collections";
import { THEMES } from "@/lib/theme";
import { RoomPanel } from "./RoomPanel";

/**
 * The Four Wardrobes for phones, reduced motion and weaker devices: the same
 * four rooms as layered illustrations that slide at different speeds
 * (parallax), no WebGL. Also what the server sends, so the content and links
 * are always in the HTML.
 */

function Layer({ y, children }: { y: MotionValue<string> | undefined; children: React.ReactNode }) {
  return (
    <motion.div aria-hidden="true" className="absolute inset-0" style={y ? { y } : undefined}>
      {children}
    </motion.div>
  );
}

/**
 * One illustration per room, drawn in the top ~60% of a 400×700 frame so the
 * words below always sit on calm background.
 */
function Scenery({ slug, accent }: { slug: CollectionInfo["slug"]; accent: string }) {
  switch (slug) {
    case "streetwear":
      return (
        <svg viewBox="0 0 400 700" preserveAspectRatio="xMidYMin slice" className="size-full">
          <defs>
            <radialGradient id="st-v" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor={accent} stopOpacity="0.7" />
              <stop offset="1" stopColor={accent} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="st-p" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#FF5FA2" stopOpacity="0.6" />
              <stop offset="1" stopColor="#FF5FA2" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="st-c" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#6FE7FF" stopOpacity="0.55" />
              <stop offset="1" stopColor="#6FE7FF" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* alley walls in perspective */}
          <path d="M0 0 L120 120 L120 330 L0 420 Z" fill="#141624" />
          <path d="M400 0 L280 120 L280 330 L400 420 Z" fill="#11131f" />
          <rect x="120" y="120" width="160" height="210" fill="#0b0c13" />
          {/* neon */}
          <ellipse cx="46" cy="190" rx="60" ry="120" fill="url(#st-v)" />
          <rect x="42" y="110" width="7" height="170" fill="#D6CCFF" />
          <ellipse cx="335" cy="140" rx="80" ry="55" fill="url(#st-p)" />
          <rect
            x="296"
            y="118"
            width="82"
            height="42"
            fill="none"
            stroke="#FFC2DC"
            strokeWidth="3.5"
          />
          <ellipse cx="330" cy="260" rx="55" ry="55" fill="url(#st-c)" />
          <circle cx="330" cy="260" r="24" fill="none" stroke="#C8F6FF" strokeWidth="3.5" />
          {/* wet-street reflections */}
          <ellipse cx="80" cy="470" rx="26" ry="90" fill="url(#st-v)" opacity="0.5" />
          <ellipse cx="320" cy="450" rx="22" ry="70" fill="url(#st-c)" opacity="0.4" />
          {/* rain */}
          {Array.from({ length: 46 }, (_, i) => (
            <rect
              key={i}
              x={(i * 89) % 400}
              y={(i * 61) % 460}
              width="1.2"
              height="24"
              fill="#B9C3FF"
              opacity="0.32"
            />
          ))}
        </svg>
      );
    case "formal":
      return (
        <svg viewBox="0 0 400 700" preserveAspectRatio="xMidYMin slice" className="size-full">
          <defs>
            <radialGradient id="fm-l" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#E6EBF2" stopOpacity="0.55" />
              <stop offset="1" stopColor="#E6EBF2" stopOpacity="0" />
            </radialGradient>
          </defs>
          {Array.from({ length: 22 }, (_, i) => (
            <rect key={i} x={i * 19} y="0" width="1" height="460" fill="#2d3138" />
          ))}
          {[80, 200, 320].map((x) => (
            <g key={x}>
              <rect x={x - 0.75} y="0" width="1.5" height="92" fill="#3a3e46" />
              <path
                d={`M${x - 30} 122 L${x + 30} 122 L${x + 15} 92 L${x - 15} 92 Z`}
                fill="#22252b"
              />
              <circle cx={x} cy="126" r="6" fill="#FFFFFF" />
              <ellipse cx={x} cy="130" rx="54" ry="40" fill="url(#fm-l)" />
              <ellipse cx={x} cy="430" rx="70" ry="16" fill="url(#fm-l)" opacity="0.6" />
            </g>
          ))}
          {/* cutting table */}
          <rect x="40" y="330" width="170" height="8" fill="#3a3f47" />
          <rect x="52" y="338" width="5" height="90" fill="#202328" />
          <rect x="194" y="338" width="5" height="90" fill="#202328" />
          <rect x="70" y="316" width="96" height="14" rx="7" fill="#1D2433" />
          {/* dress forms */}
          {[
            [262, "#9aa0aa"],
            [330, "#1D2433"],
          ].map(([x, c]) => (
            <g key={x as number} fill={c as string}>
              <ellipse cx={x as number} cy="250" rx="30" ry="10" />
              <path
                d={`M${(x as number) - 26} 252 Q${x} 240 ${(x as number) + 26} 252 L${(x as number) + 20} 330 L${(x as number) - 20} 330 Z`}
              />
              <rect x={(x as number) - 2} y="330" width="4" height="96" fill="#2b2e34" />
              <ellipse cx={x as number} cy="428" rx="24" ry="5" fill="#202328" />
            </g>
          ))}
        </svg>
      );
    case "old-money":
      return (
        <svg viewBox="0 0 400 700" preserveAspectRatio="xMidYMin slice" className="size-full">
          {/* bookcase */}
          <rect x="0" y="40" width="170" height="380" fill="#4a3826" />
          {[0, 1, 2, 3, 4].map((r) => (
            <g key={r}>
              <rect x="8" y={58 + r * 72} width="154" height="58" fill="#33261a" />
              {Array.from({ length: 15 }, (_, c) => (
                <rect
                  key={c}
                  x={11 + c * 10}
                  y={116 + r * 72 - (38 + ((c * 7 + r * 5) % 16))}
                  width="8"
                  height={38 + ((c * 7 + r * 5) % 16)}
                  fill={
                    ["#2F4A3A", "#6E1F1F", "#1F2A44", "#C9B38A", "#5B4632", "#E4D9C3", "#7A5C28"][
                      (c * 3 + r) % 7
                    ]
                  }
                />
              ))}
            </g>
          ))}
          {/* window and the light falling from it */}
          <rect x="228" y="60" width="132" height="230" fill="#FFF9EC" />
          <rect x="292" y="60" width="4" height="230" fill="#d9ccb1" />
          <rect x="228" y="160" width="132" height="4" fill="#d9ccb1" />
          <path d="M228 290 L360 290 L330 560 L130 560 Z" fill="#FFE7B8" opacity="0.32" />
          {/* armchair */}
          <g fill="#6B3F24">
            <rect x="200" y="360" width="84" height="40" />
            <rect x="200" y="320" width="84" height="44" fill="#5c3520" />
            <rect x="192" y="344" width="14" height="56" fill="#5c3520" />
            <rect x="278" y="344" width="14" height="56" fill="#5c3520" />
          </g>
          <rect x="150" y="430" width="230" height="16" fill="#2F4A3A" opacity="0.8" />
        </svg>
      );
    case "riding":
      return (
        <svg viewBox="0 0 400 700" preserveAspectRatio="xMidYMin slice" className="size-full">
          <defs>
            <linearGradient id="rd-sky" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#0D0F10" />
              <stop offset="1" stopColor="#4A2A14" />
            </linearGradient>
            <radialGradient id="rd-l" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0" stopColor="#E8833A" stopOpacity="0.85" />
              <stop offset="1" stopColor="#E8833A" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="400" height="260" fill="url(#rd-sky)" />
          <rect y="258" width="400" height="442" fill="#0b0d0e" />
          <path d="M184 258 L216 258 L400 560 L0 560 Z" fill="#16191b" />
          <path d="M184 258 L0 560" stroke="#6f7378" strokeWidth="1.5" />
          <path d="M216 258 L400 560" stroke="#6f7378" strokeWidth="1.5" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect
              key={i}
              x={199 - i * 0.8}
              y={266 + i * i * 7}
              width={2 + i * 1.6}
              height={6 + i * 4}
              fill="#C9C2B6"
              opacity="0.55"
            />
          ))}
          {/* streetlights, nearest first */}
          {[
            [70, 60, 1],
            [128, 160, 0.6],
            [160, 215, 0.38],
          ].flatMap(([x, y, s]) =>
            [x, 400 - x].map((xx, k) => (
              <g key={`${xx}${y}`}>
                <rect
                  x={xx - 1.5 * s}
                  y={y}
                  width={3 * s}
                  height={(560 - y) * 0.75}
                  fill="#1b1e21"
                />
                <rect x={k ? xx - 26 * s : xx} y={y} width={26 * s} height={3 * s} fill="#1b1e21" />
                <ellipse
                  cx={k ? xx - 24 * s : xx + 24 * s}
                  cy={y + 8 * s}
                  rx={42 * s}
                  ry={34 * s}
                  fill="url(#rd-l)"
                />
                <rect
                  x={k ? xx - 32 * s : xx + 16 * s}
                  y={y + 2 * s}
                  width={16 * s}
                  height={4 * s}
                  fill="#FFC48A"
                />
              </g>
            )),
          )}
          {Array.from({ length: 40 }, (_, i) => (
            <circle
              key={i}
              cx={(i * 53) % 400}
              cy={248 + (i % 5) * 2}
              r="1"
              fill="#FFC48A"
              opacity="0.8"
            />
          ))}
        </svg>
      );
  }
}

function Room25D({ room }: { room: CollectionInfo }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const far = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  const near = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);
  const t = THEMES[room.theme];

  // while this room fills most of the screen, the whole site wears its theme
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let release: (() => void) | null = null;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !release) release = pushTheme(room.theme);
        if (!entry.isIntersecting && release) {
          release();
          release = null;
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      release?.();
    };
  }, [room.theme]);

  return (
    <article
      ref={ref}
      aria-labelledby={`room-${room.slug}`}
      className="relative flex min-h-[110svh] items-end overflow-hidden px-gutter pt-32 pb-24"
      style={{ backgroundColor: t.background, color: t.foreground }}
    >
      <Layer y={reduce ? undefined : far}>
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(90% 60% at 70% 20%, ${t.accent}40 0%, transparent 70%)`,
          }}
        />
      </Layer>
      <Layer y={reduce ? undefined : near}>
        <Scenery slug={room.slug} accent={t.accent} />
      </Layer>
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: `linear-gradient(180deg, transparent 35%, ${t.background} 92%)` }}
      />
      <div className="relative mx-auto w-full max-w-site">
        <RoomPanel room={room} headingId={`room-${room.slug}`} />
      </div>
    </article>
  );
}

export function Journey25D() {
  return (
    <section aria-labelledby="wardrobes-title">
      <h2 id="wardrobes-title" className="sr-only">
        The four wardrobes
      </h2>
      {COLLECTIONS.map((room) => (
        <Room25D key={room.slug} room={room} />
      ))}
    </section>
  );
}
