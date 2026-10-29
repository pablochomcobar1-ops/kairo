"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Color, Fog } from "three";
import { THEMES, type ThemeName } from "@/lib/theme";
import { cameraZAt, roomZ } from "./path";
import { FormalRoom, OldMoneyRoom, RidingRoom, StreetRoom } from "./rooms";

/** How far you can see in each room (the highway wants distance, the alley wants mystery). */
const FOG_FAR = [30, 32, 46, 120] as const;
const FOLLOW = 4.5; // per second, same feel as the silk

function Rig({ progress, room, theme }: { progress: RefObject<number>; room: number; theme: ThemeName }) {
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const smooth = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const target = useMemo(() => new Color(), []);

  useEffect(() => {
    const bg = new Color(THEMES.street.background);
    scene.background = bg;
    scene.fog = new Fog(bg.clone(), 4, FOG_FAR[0]);
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene]);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (e.pointerType !== "mouse") return;
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const k = 1 - Math.exp(-FOLLOW * delta);

    // ease toward the scroll position so wheel steps don't look like jumps
    smooth.current += ((progress.current ?? 0) - smooth.current) * (1 - Math.exp(-8 * delta));
    const t = state.clock.elapsedTime;
    camera.position.set(Math.sin(t * 0.3) * 0.12, 1.65 + Math.sin(t * 0.6) * 0.03, cameraZAt(smooth.current));
    camera.rotation.set(-pointer.current.y * 0.03, -pointer.current.x * 0.06, 0);

    // fog and sky follow the room's theme
    target.set(THEMES[theme].background);
    if (!scene.fog || !(scene.background instanceof Color)) return;
    scene.background.lerp(target, k);
    const fog = scene.fog as Fog;
    fog.color.lerp(target, k);
    fog.far += (FOG_FAR[room] - fog.far) * k;
  });

  return null;
}

type Props = {
  /** 0..1 scroll progress through the journey, written by ScrollTrigger */
  progress: RefObject<number>;
  room: number;
  theme: ThemeName;
  paused: boolean;
  onReady?: () => void;
};

const near = (i: number, room: number) => Math.abs(i - room) <= 1;

function Ready({ onReady }: { onReady?: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (!done.current) {
      done.current = true;
      onReady?.();
    }
  });
  return null;
}

/** The four rooms in one WebGL scene. Loaded only on capable desktops. */
export default function JourneyCanvas({ progress, room, theme, paused, onReady }: Props) {
  return (
    <Canvas
      aria-hidden="true"
      frameloop={paused ? "never" : "always"}
      dpr={[1, 1.5]}
      camera={{ fov: 58, near: 0.1, far: 220, position: [0, 1.65, 7] }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0 }}
    >
      <Rig progress={progress} room={room} theme={theme} />
      {/* only the room you're in and its neighbours are drawn; the rest stay loaded but skipped */}
      <group visible={near(0, room)}>
        <StreetRoom z={roomZ(0)} />
      </group>
      <group visible={near(1, room)}>
        <FormalRoom z={roomZ(1)} />
      </group>
      <group visible={near(2, room)}>
        <OldMoneyRoom z={roomZ(2)} />
      </group>
      <group visible={near(3, room)}>
        <RidingRoom z={roomZ(3)} />
      </group>
      <Ready onReady={onReady} />
    </Canvas>
  );
}
