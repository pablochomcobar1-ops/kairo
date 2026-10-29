"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { pickSilkMode, readDevice, type SilkMode } from "@/lib/three/capability";
import { SilkFallback } from "./SilkFallback";

// three.js only loads in the browser, after the page is interactive.
const SilkCanvas = dynamic(() => import("./SilkCanvas"), { ssr: false });

/**
 * The silk behind the hero. Server HTML shows the still silk (instant, no layout
 * shift); capable browsers then fade the live WebGL silk in over it. Rendering
 * pauses when the hero scrolls away or the tab is hidden.
 */
export function SilkHero({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<SilkMode>("still");
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // decide after first paint so the hero text paints first (better LCP)
    const id = requestIdleCallbackSafe(() => setMode(pickSilkMode(readDevice())));
    return () => cancelIdleCallbackSafe(id);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div ref={ref} className={cn("absolute inset-0 -z-10 overflow-hidden", className)}>
      <SilkFallback className={cn("absolute inset-0 size-full transition-opacity duration-1000", ready && "opacity-0")} />
      {mode !== "still" && (
        <div className={cn("absolute inset-0 transition-opacity duration-1000 ease-out", ready ? "opacity-100" : "opacity-0")}>
          <SilkCanvas quality={mode} paused={!inView || !tabVisible} onReady={() => setReady(true)} />
        </div>
      )}
      {/* keeps text readable over the brightest folds */}
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-background/40 via-transparent to-background" />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: "radial-gradient(80% 75% at 12% 88%, color-mix(in oklab, var(--color-background) 85%, transparent) 0%, transparent 72%)" }}
      />
    </div>
  );
}

type IdleHandle = number;
const hasIdle = () => typeof window.requestIdleCallback === "function";

function requestIdleCallbackSafe(cb: () => void): IdleHandle {
  return hasIdle() ? window.requestIdleCallback(cb, { timeout: 1200 }) : window.setTimeout(cb, 200);
}
function cancelIdleCallbackSafe(id: IdleHandle) {
  if (hasIdle()) window.cancelIdleCallback(id);
  else window.clearTimeout(id);
}
