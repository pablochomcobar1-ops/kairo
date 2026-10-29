"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Color, ShaderMaterial, Vector2 } from "three";
import { THEME_EVENT, currentTheme, type ThemeEvent } from "@/components/layout/ThemeSignal";
import { SILK, type ThemeName } from "@/lib/theme";
import { SILK_FRAGMENT, SILK_VERTEX } from "./glsl";

/** How quickly colours and fold speed follow a theme change (per second). ~0.9 s to settle. */
const THEME_FOLLOW = 4.5;
/** How quickly the dent follows the cursor. */
const POINTER_FOLLOW = 5;

type Props = {
  /** "lite" uses fewer vertices for phones and weak devices */
  quality: "full" | "lite";
  /** Pause rendering (off screen or tab hidden) */
  paused: boolean;
  onReady?: () => void;
};

function Silk({ quality, onReady }: Omit<Props, "paused">) {
  const viewport = useThree((s) => s.viewport);
  const target = useRef(SILK[currentTheme()]);
  const pointerTarget = useRef(new Vector2(0, 0));
  const pressTarget = useRef(0);
  const ready = useRef(false);

  const material = useMemo(() => {
    const look = SILK[currentTheme()];
    return new ShaderMaterial({
      vertexShader: SILK_VERTEX,
      fragmentShader: SILK_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uFold: { value: look.fold },
        uPointer: { value: new Vector2(0, 0) },
        uPress: { value: 0 },
        uBase: { value: new Color(look.base) },
        uShadow: { value: new Color(look.shadow) },
        uLight: { value: new Color(look.light) },
        uSheen: { value: look.sheen },
      },
    });
  }, []);

  useEffect(() => () => material.dispose(), [material]);

  // Follow the site theme (collection pages, the Four Wardrobes scroll).
  useEffect(() => {
    function onTheme(e: Event) {
      target.current = SILK[(e as ThemeEvent).detail.theme as ThemeName];
    }
    window.addEventListener(THEME_EVENT, onTheme);
    return () => window.removeEventListener(THEME_EVENT, onTheme);
  }, []);

  // Mouse anywhere on the page (the hero sits under the text, which would block canvas events).
  // Phones: a gentle tilt response where the browser allows it without a permission prompt.
  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -((e.clientY / window.innerHeight) * 2 - 1);
      pointerTarget.current.set((nx * viewport.width) / 2, (ny * viewport.height) / 2);
      pressTarget.current = 1;
    }
    function onTilt(e: DeviceOrientationEvent) {
      if (e.gamma == null || e.beta == null) return;
      const nx = Math.max(-1, Math.min(1, e.gamma / 30));
      const ny = Math.max(-1, Math.min(1, (45 - e.beta) / 30));
      pointerTarget.current.set((nx * viewport.width) / 2, (ny * viewport.height) / 2);
      pressTarget.current = 0.6;
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("deviceorientation", onTilt, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("deviceorientation", onTilt);
    };
  }, [viewport.width, viewport.height]);

  const tmp = useMemo(() => new Color(), []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05); // no big jumps after a tab switch
    const u = material.uniforms;
    const k = 1 - Math.exp(-THEME_FOLLOW * delta);
    const look = target.current;

    u.uTime.value += delta;
    (u.uBase.value as Color).lerp(tmp.set(look.base), k);
    (u.uShadow.value as Color).lerp(tmp.set(look.shadow), k);
    (u.uLight.value as Color).lerp(tmp.set(look.light), k);
    u.uSheen.value += (look.sheen - u.uSheen.value) * k;
    u.uFold.value += (look.fold - u.uFold.value) * k;

    const kp = 1 - Math.exp(-POINTER_FOLLOW * delta);
    (u.uPointer.value as Vector2).lerp(pointerTarget.current, kp);
    u.uPress.value += (pressTarget.current - u.uPress.value) * kp;
    pressTarget.current *= Math.exp(-0.8 * delta); // the dent relaxes when the mouse rests

    if (!ready.current) {
      ready.current = true;
      onReady?.();
    }
  });

  const [segX, segY] = quality === "full" ? [180, 100] : [96, 56];
  // big enough to overfill any aspect ratio, so the edges never show
  const w = Math.max(viewport.width, viewport.height * 1.2) * 1.8;
  const h = Math.max(viewport.height, viewport.width * 0.6) * 1.8;

  return (
    <mesh material={material} rotation={[-0.28, 0.06, -0.05]}>
      <planeGeometry args={[w, h, segX, segY]} />
    </mesh>
  );
}

/** The full-bleed WebGL silk. Loaded only in the browser, after the page is interactive. */
export default function SilkCanvas({ quality, paused, onReady }: Props) {
  return (
    <Canvas
      aria-hidden="true"
      frameloop={paused ? "never" : "always"}
      dpr={quality === "full" ? [1, 1.5] : [1, 1.25]}
      camera={{ position: [0, 0, 6], fov: 45, near: 0.1, far: 50 }}
      gl={{ antialias: quality === "full", alpha: false, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Silk quality={quality} onReady={onReady} />
    </Canvas>
  );
}
