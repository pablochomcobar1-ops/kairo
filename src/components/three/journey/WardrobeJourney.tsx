"use client";

import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { CollectionLink } from "@/components/layout/CollectionLink";
import { pushTheme } from "@/components/layout/ThemeSignal";
import { useLenis } from "@/components/motion/SmoothScroll";
import { COLLECTIONS } from "@/lib/collections";
import { cn } from "@/lib/cn";
import { pickJourneyMode, readDevice, type JourneyMode } from "@/lib/three/capability";
import { Journey25D } from "./Journey25D";
import { activeRoomAt } from "./path";
import { RoomPanel } from "./RoomPanel";

const JourneyCanvas = dynamic(() => import("./JourneyCanvas"), { ssr: false });

/** How much scrolling the journey takes, in screen heights (one per room). */
const SCROLL_SCREENS = 3.2;

/**
 * The Four Wardrobes. Capable desktops get the 3D walk-through, pinned while
 * you scroll; everyone else (and the server HTML) gets the 2.5D version.
 * Both switch the whole site's theme to the room you're in.
 */
export function WardrobeJourney() {
  const [mode, setMode] = useState<JourneyMode>("2.5d");

  useEffect(() => {
    const decide = () => setMode(pickJourneyMode(readDevice()));
    decide();
    // e.g. rotating a tablet or resizing a window across the breakpoint
    const mq = window.matchMedia("(min-width: 48rem)");
    mq.addEventListener("change", decide);
    return () => mq.removeEventListener("change", decide);
  }, []);

  return mode === "3d" ? <Journey3D /> : <Journey25D />;
}

function Journey3D() {
  const section = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [room, setRoom] = useState(0);
  const [inside, setInside] = useState(false);
  const [ready, setReady] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  const lenis = useLenis();

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    let cancelled = false;
    let cleanup = () => {};

    // GSAP + ScrollTrigger load only here, so pages without the 3D journey never download them
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const onLenisScroll = () => ScrollTrigger.update();
      lenis?.on("scroll", onLenisScroll);
      const ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: el,
          start: "top top",
          end: () => `+=${window.innerHeight * SCROLL_SCREENS}`,
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
          onToggle: (self) => setInside(self.isActive),
          onUpdate: (self) => {
            progress.current = self.progress;
            const next = activeRoomAt(self.progress);
            setRoom((r) => (r === next ? r : next));
          },
        });
      }, el);
      cleanup = () => {
        lenis?.off("scroll", onLenisScroll);
        ctx.revert();
      };
    });

    const onVis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      cleanup();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [lenis]);

  // the site wears the current room's theme while you are in the journey
  const theme = COLLECTIONS[room].theme;
  useEffect(() => {
    if (!inside) return;
    return pushTheme(theme);
  }, [inside, theme]);

  return (
    <section ref={section} aria-labelledby="wardrobes-title" className="relative h-svh overflow-hidden bg-background">
      <h2 id="wardrobes-title" className="sr-only">
        The four wardrobes
      </h2>

      <div className={cn("absolute inset-0 transition-opacity duration-700", ready ? "opacity-100" : "opacity-0")}>
        <JourneyCanvas progress={progress} room={room} theme={theme} paused={!tabVisible} onReady={() => setReady(true)} />
      </div>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-t from-background/85 via-background/10 to-transparent" />

      {/* the room you're in */}
      <div className="absolute inset-x-0 bottom-0 px-gutter pb-16">
        <div className="mx-auto max-w-site">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={room}
              initial={{ opacity: 0, transform: "translateY(18px)" }}
              animate={{ opacity: 1, transform: "translateY(0px)" }}
              exit={{ opacity: 0, transform: "translateY(-10px)", transition: { duration: 0.18 } }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            >
              <RoomPanel room={COLLECTIONS[room]} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* where you are in the four */}
      <ol aria-hidden="true" className="absolute right-gutter top-1/2 hidden -translate-y-1/2 flex-col gap-3 md:flex">
        {COLLECTIONS.map((c, i) => (
          <li key={c.slug} className="flex items-center justify-end gap-3 font-mono text-caption02 uppercase">
            <span className={cn("transition-opacity duration-300", i === room ? "opacity-100" : "opacity-0")}>{c.name}</span>
            <span className={cn("h-px transition-[width,background-color] duration-300", i === room ? "w-10 bg-accent" : "w-5 bg-foreground-subtle")} />
          </li>
        ))}
      </ol>

      {/* keyboard and screen-reader users can jump straight to any wardrobe */}
      <nav aria-label="The four wardrobes" className="sr-only">
        <ul>
          {COLLECTIONS.map((c) => (
            <li key={c.slug}>
              <CollectionLink href={c.href}>{c.name}</CollectionLink>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
