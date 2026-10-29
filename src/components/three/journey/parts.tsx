"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Object3D,
  type InstancedMesh,
  type Texture,
} from "three";
import { glowTexture, gradientTexture, posterTexture } from "./textures";

/** Room box shared by the three indoor rooms. Open at the front, doorway in the back wall. */
export const ROOM = { W: 12, H: 7, FRONT: 8, BACK: -16, DOOR_W: 2.4, DOOR_H: 3.4 } as const;
const DEPTH = ROOM.FRONT - ROOM.BACK;
const MID_Z = (ROOM.FRONT + ROOM.BACK) / 2;

type Vec3 = [number, number, number];

export function Glow({
  position,
  rotation = [0, 0, 0],
  scale = [1, 1],
  color,
  opacity = 1,
  map,
}: {
  position: Vec3;
  rotation?: Vec3;
  scale?: [number, number];
  color: string;
  opacity?: number;
  map?: Texture;
}) {
  const tex = useMemo(() => map ?? glowTexture(), [map]);
  return (
    <mesh position={position} rotation={rotation} scale={[scale[0], scale[1], 1]} renderOrder={2}>
      <planeGeometry />
      <meshBasicMaterial
        map={tex}
        color={color}
        transparent
        opacity={opacity}
        blending={AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/** A bright tube: neon, bulbs, lamp heads. Not affected by fog so it still glows through haze. */
export function Tube({ position, size, color, rotation }: { position: Vec3; size: Vec3; color: string; rotation?: Vec3 }) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshBasicMaterial color={color} toneMapped={false} fog={false} />
    </mesh>
  );
}

export function Block({
  position,
  size,
  color,
  rotation,
  scale,
}: {
  position: Vec3;
  size: Vec3;
  color: string;
  rotation?: Vec3;
  scale?: Vec3;
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <boxGeometry args={size} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

export function Shell({
  wallTop,
  wallBottom,
  floor,
  ceiling,
  floorMap,
}: {
  wallTop: string;
  wallBottom: string;
  floor: string;
  ceiling: string;
  floorMap?: Texture;
}) {
  const wall = useMemo(() => gradientTexture(wallTop, wallBottom), [wallTop, wallBottom]);
  const sideW = (ROOM.W - ROOM.DOOR_W) / 2;
  return (
    <group>
      {/* floor and ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, MID_Z]}>
        <planeGeometry args={[ROOM.W, DEPTH]} />
        <meshBasicMaterial color={floor} map={floorMap} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM.H, MID_Z]}>
        <planeGeometry args={[ROOM.W, DEPTH]} />
        <meshBasicMaterial color={ceiling} />
      </mesh>
      {/* side walls */}
      <mesh rotation={[0, Math.PI / 2, 0]} position={[-ROOM.W / 2, ROOM.H / 2, MID_Z]}>
        <planeGeometry args={[DEPTH, ROOM.H]} />
        <meshBasicMaterial map={wall} />
      </mesh>
      <mesh rotation={[0, -Math.PI / 2, 0]} position={[ROOM.W / 2, ROOM.H / 2, MID_Z]}>
        <planeGeometry args={[DEPTH, ROOM.H]} />
        <meshBasicMaterial map={wall} />
      </mesh>
      {/* back wall with a doorway through to the next room */}
      <mesh position={[-(ROOM.DOOR_W / 2 + sideW / 2), ROOM.H / 2, ROOM.BACK]}>
        <planeGeometry args={[sideW, ROOM.H]} />
        <meshBasicMaterial map={wall} />
      </mesh>
      <mesh position={[ROOM.DOOR_W / 2 + sideW / 2, ROOM.H / 2, ROOM.BACK]}>
        <planeGeometry args={[sideW, ROOM.H]} />
        <meshBasicMaterial map={wall} />
      </mesh>
      <mesh position={[0, ROOM.DOOR_H + (ROOM.H - ROOM.DOOR_H) / 2, ROOM.BACK]}>
        <planeGeometry args={[ROOM.DOOR_W, ROOM.H - ROOM.DOOR_H]} />
        <meshBasicMaterial map={wall} />
      </mesh>
    </group>
  );
}

/**
 * A framed product on the wall. Shows a stand-in poster until the photo
 * shoot (Task 13) swaps in the real product photo.
 */
export function Frame({
  position,
  rotation = [0, 0, 0],
  size = [1.5, 2.06],
  bg,
  accent,
  frame,
  label,
}: {
  position: Vec3;
  rotation?: Vec3;
  size?: [number, number];
  bg: string;
  accent: string;
  frame: string;
  label: string;
}) {
  const poster = useMemo(() => posterTexture(bg, accent, label), [bg, accent, label]);
  const [w, h] = size;
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.03]}>
        <boxGeometry args={[w + 0.14, h + 0.14, 0.05]} />
        <meshBasicMaterial color={frame} />
      </mesh>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={poster} side={DoubleSide} />
      </mesh>
      <Glow position={[0, h / 2 + 0.25, 0.05]} scale={[w * 1.6, 0.9]} color={accent} opacity={0.35} />
    </group>
  );
}

/** Many copies of one box shape with their own position, size and colour: one draw call. */
export function InstancedBoxes({
  items,
}: {
  items: { position: Vec3; scale: Vec3; color: string; rotation?: Vec3 }[];
}) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    const c = new Color();
    items.forEach((it, i) => {
      o.position.set(...it.position);
      o.rotation.set(...(it.rotation ?? [0, 0, 0]));
      o.scale.set(...it.scale);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
      mesh.setColorAt(i, c.set(it.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} frustumCulled={false}>
      <boxGeometry />
      <meshBasicMaterial />
    </instancedMesh>
  );
}

/** Many glows with one texture and colour: one draw call (streetlights, lamp pools). */
export function InstancedGlows({
  items,
  color,
  opacity = 1,
}: {
  items: { position: Vec3; scale: [number, number]; rotation?: Vec3 }[];
  color: string;
  opacity?: number;
}) {
  const ref = useRef<InstancedMesh>(null);
  const tex = useMemo(() => glowTexture(), []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new Object3D();
    items.forEach((it, i) => {
      o.position.set(...it.position);
      o.rotation.set(...(it.rotation ?? [0, 0, 0]));
      o.scale.set(it.scale[0], it.scale[1], 1);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [items]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} frustumCulled={false} renderOrder={2}>
      <planeGeometry />
      <meshBasicMaterial
        map={tex}
        color={color}
        transparent
        opacity={opacity}
        blending={AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/** Deterministic pseudo-random numbers, so rooms look the same on every visit. */
export function seeded(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
