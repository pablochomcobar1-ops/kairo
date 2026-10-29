"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  ShaderMaterial,
  type Group,
} from "three";
import {
  Block,
  Frame,
  Glow,
  InstancedBoxes,
  InstancedGlows,
  ROOM,
  Shell,
  Tube,
  seeded,
} from "./parts";
import { beamTexture, gradientTexture } from "./textures";

const { W, H, BACK } = ROOM;
const HALF = W / 2 - 0.04; // a hair in front of the side walls

/* ---------------------------------------------------------------------------
 * 01 STREETWEAR: a neon alley in the rain
 * ------------------------------------------------------------------------- */

function Rain({ count = 650 }: { count?: number }) {
  const { geometry, material } = useMemo(() => {
    const rand = seeded(1);
    const pos = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * (W - 1);
      pos[i * 3 + 1] = rand() * H;
      pos[i * 3 + 2] = BACK + rand() * (ROOM.FRONT - BACK);
      speed[i] = 7 + rand() * 5;
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aSpeed", new BufferAttribute(speed, 1));
    const m = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uColor: { value: new Color("#B9C3FF") } },
      vertexShader: /* glsl */ `
        attribute float aSpeed;
        uniform float uTime;
        void main() {
          vec3 p = position;
          p.y = mod(p.y - uTime * aSpeed, ${H.toFixed(1)});
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = 90.0 / -mv.z;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float a = smoothstep(0.05, 0.0, abs(c.x)) * (0.5 - c.y);
          gl_FragColor = vec4(uColor, a * 0.4);
        }`,
    });
    return { geometry: g, material: m };
  }, [count]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );
  useFrame((_, dt) => {
    material.uniforms.uTime.value += Math.min(dt, 0.05);
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}

export function StreetRoom({ z }: { z: number }) {
  const violet = "#9B87F5";
  const pink = "#FF5FA2";
  const cyan = "#6FE7FF";
  return (
    <group position={[0, 0, z]}>
      <Shell wallTop="#1d2030" wallBottom="#0a0b11" floor="#07080c" ceiling="#040406" />

      {/* left wall: tall violet tube + pink sign */}
      <Tube position={[-HALF, 3.4, -2.2]} size={[0.07, 2.6, 0.07]} color="#C9BEFF" />
      <Glow
        position={[-HALF + 0.02, 3.4, -2.2]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[3.2, 4.6]}
        color={violet}
        opacity={0.8}
      />
      <Glow
        position={[-3.4, 0.02, -2.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1.6, 6]}
        color={violet}
        opacity={0.35}
      />

      <group position={[-HALF, 4.2, -8.5]} rotation={[0, Math.PI / 2, 0]}>
        <Tube position={[0, 0.55, 0]} size={[2.4, 0.06, 0.06]} color="#FFC2DC" />
        <Tube position={[0, -0.55, 0]} size={[2.4, 0.06, 0.06]} color="#FFC2DC" />
        <Tube position={[-1.2, 0, 0]} size={[0.06, 1.16, 0.06]} color="#FFC2DC" />
        <Tube position={[1.2, 0, 0]} size={[0.06, 1.16, 0.06]} color="#FFC2DC" />
        <Glow position={[0, 0, 0.02]} scale={[4.4, 2.8]} color={pink} opacity={0.75} />
      </group>
      <Glow
        position={[-3.6, 0.02, -8.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[2.2, 6]}
        color={pink}
        opacity={0.3}
      />

      {/* right wall: cyan ring, shutter, violet bar */}
      <mesh position={[HALF, 4, -4.5]} rotation={[0, -Math.PI / 2, 0]}>
        <torusGeometry args={[0.62, 0.035, 8, 48]} />
        <meshBasicMaterial color="#C8F6FF" toneMapped={false} fog={false} />
      </mesh>
      <Glow
        position={[HALF - 0.02, 4, -4.5]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[3, 3]}
        color={cyan}
        opacity={0.7}
      />
      <Glow
        position={[3.6, 0.02, -4.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1.6, 5]}
        color={cyan}
        opacity={0.28}
      />

      <Block position={[HALF - 0.06, 1.35, -9.5]} size={[0.1, 2.7, 3.4]} color="#191c27" />
      <InstancedBoxes
        items={Array.from({ length: 12 }, (_, i) => ({
          position: [HALF - 0.12, 0.2 + i * 0.21, -9.5] as [number, number, number],
          scale: [0.02, 0.03, 3.3] as [number, number, number],
          color: "#2a2e3d",
        }))}
      />
      <Tube position={[HALF, 3.1, -12.2]} size={[0.07, 0.07, 3]} color="#C9BEFF" />
      <Glow
        position={[HALF - 0.02, 3.1, -12.2]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[4.6, 2]}
        color={violet}
        opacity={0.6}
      />

      {/* pipes and an AC unit for grit */}
      <Block position={[-HALF + 0.12, H / 2, -5.4]} size={[0.12, H, 0.12]} color="#151824" />
      <Block position={[HALF - 0.25, 5.4, -1.6]} size={[0.5, 0.6, 0.9]} color="#202434" />

      {/* doorway glow hints at the next room */}
      <Glow position={[0, 1.7, BACK + 0.05]} scale={[2.6, 3.6]} color="#B8C0CC" opacity={0.18} />

      <Frame
        position={[-HALF + 0.04, 2.3, -12.6]}
        rotation={[0, Math.PI / 2, 0]}
        bg="#14121F"
        accent={violet}
        frame="#0b0c12"
        label="STATIC HEAVY TEE"
      />
      <Frame
        position={[HALF - 0.04, 2.3, -1.2]}
        rotation={[0, -Math.PI / 2, 0]}
        bg="#14121F"
        accent={pink}
        frame="#0b0c12"
        label="AFTERHOURS HOODIE"
      />

      <Rain />
    </group>
  );
}

/* ---------------------------------------------------------------------------
 * 02 FORMAL: a tailor's atelier
 * ------------------------------------------------------------------------- */

function PendantLamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Block position={[0, 6.1, 0]} size={[0.015, 1.8, 0.015]} color="#0d0e10" />
      <mesh position={[0, 5.05, 0]}>
        <coneGeometry args={[0.4, 0.42, 24, 1, true]} />
        <meshBasicMaterial color="#1c1f24" side={DoubleSide} />
      </mesh>
      <mesh position={[0, 4.88, 0]}>
        <sphereGeometry args={[0.1, 12, 8]} />
        <meshBasicMaterial color="#FFFFFF" toneMapped={false} fog={false} />
      </mesh>
      <Glow position={[0, 4.85, 0.1]} scale={[1.8, 1.8]} color="#E6EBF2" opacity={0.9} />
      <Glow
        position={[0, 0.02, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[3.6, 3.6]}
        color="#DDE3EC"
        opacity={0.32}
      />
    </group>
  );
}

function DressForm({
  position,
  cloth = "#9aa0aa",
}: {
  position: [number, number, number];
  cloth?: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.04, 24]} />
        <meshBasicMaterial color="#202328" />
      </mesh>
      <Block position={[0, 0.55, 0]} size={[0.05, 1.05, 0.05]} color="#2b2e34" />
      <mesh position={[0, 1.45, 0]} scale={[1, 1, 0.7]}>
        <cylinderGeometry args={[0.31, 0.24, 0.85, 24]} />
        <meshBasicMaterial color={cloth} />
      </mesh>
      <mesh position={[0, 1.88, 0]} scale={[1.3, 0.34, 0.8]}>
        <sphereGeometry args={[0.3, 20, 12]} />
        <meshBasicMaterial color={cloth} />
      </mesh>
      <mesh position={[0, 2.03, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.2, 12]} />
        <meshBasicMaterial color="#c9ccd2" />
      </mesh>
    </group>
  );
}

export function FormalRoom({ z }: { z: number }) {
  const bolts = useMemo(() => {
    const rand = seeded(2);
    const palette = ["#2C3036", "#1D2433", "#4A4F58", "#6B717C", "#3B2A2E", "#8C929C", "#232629"];
    const items: {
      position: [number, number, number];
      scale: [number, number, number];
      color: string;
      rotation: [number, number, number];
    }[] = [];
    for (const y of [1.33, 2.33, 3.33]) {
      for (let zz = -6.2; zz > -12.2; zz -= 0.3) {
        items.push({
          position: [-HALF + 0.45, y, zz],
          scale: [0.85, 0.24, 0.24],
          rotation: [0, 0, 0],
          color: palette[Math.floor(rand() * palette.length)],
        });
      }
    }
    return items;
  }, []);

  return (
    <group position={[0, 0, z]}>
      <Shell wallTop="#30343c" wallBottom="#141518" floor="#131417" ceiling="#0c0d0f" />

      <PendantLamp x={-2} z={-6} />
      <PendantLamp x={0.6} z={-6.6} />
      <PendantLamp x={3} z={-6} />

      {/* cutting table with cloth */}
      <Block position={[-1.6, 0.92, -7]} size={[3.2, 0.08, 1.5]} color="#3a3f47" />
      {[
        [-3.1, -6.35],
        [-0.1, -6.35],
        [-3.1, -7.65],
        [-0.1, -7.65],
      ].map(([x, zz]) => (
        <Block
          key={`${x}${zz}`}
          position={[x, 0.45, zz]}
          size={[0.07, 0.9, 0.07]}
          color="#202328"
        />
      ))}
      <mesh position={[-1.9, 1.1, -7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.14, 0.14, 1.7, 20]} />
        <meshBasicMaterial color="#1D2433" />
      </mesh>
      <Block
        position={[-0.9, 0.97, -6.9]}
        size={[1.4, 0.02, 1.1]}
        color="#59606b"
        rotation={[0, 0.2, 0]}
      />

      {/* dress forms down the right side; the middle one wears navy */}
      <DressForm position={[3.4, 0, -4]} />
      <DressForm position={[3.6, 0, -7.6]} cloth="#1D2433" />
      <DressForm position={[3.4, 0, -11.2]} />

      {/* shelves of cloth bolts on the left wall */}
      {[1.18, 2.18, 3.18].map((y) => (
        <Block key={y} position={[-HALF + 0.3, y, -9.2]} size={[0.6, 0.05, 6.4]} color="#26292e" />
      ))}
      <InstancedBoxes items={bolts} />

      {/* a quiet pinstripe on the back wall */}
      <InstancedBoxes
        items={Array.from({ length: 36 }, (_, i) => ({
          position: [-5.8 + i * 0.33, H / 2, BACK + 0.02] as [number, number, number],
          scale: [0.012, H, 0.01] as [number, number, number],
          color: "#2d3138",
        }))}
      />

      <Glow position={[0, 1.7, BACK + 0.05]} scale={[2.6, 3.6]} color="#F5E6C8" opacity={0.3} />

      <Frame
        position={[-HALF + 0.04, 2.4, -2.2]}
        rotation={[0, Math.PI / 2, 0]}
        bg="#1A1C21"
        accent="#DDE3EC"
        frame="#0c0d0f"
        label="BOARDROOM BLAZER"
      />
      <Frame
        position={[HALF - 0.04, 2.4, -14]}
        rotation={[0, -Math.PI / 2, 0]}
        bg="#1A1C21"
        accent="#B8C0CC"
        frame="#0c0d0f"
        label="OXFORD DRESS SHIRT"
      />
    </group>
  );
}

/* ---------------------------------------------------------------------------
 * 03 OLD MONEY: a sunlit library
 * ------------------------------------------------------------------------- */

function Armchair({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation: number;
}) {
  const leather = "#6B3F24";
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Block position={[0, 0.26, 0]} size={[1.05, 0.42, 1]} color={leather} />
      <Block position={[0, 0.78, -0.42]} size={[1.05, 0.95, 0.22]} color="#5c3520" />
      <Block position={[-0.5, 0.52, 0]} size={[0.18, 0.55, 1]} color="#5c3520" />
      <Block position={[0.5, 0.52, 0]} size={[0.18, 0.55, 1]} color="#5c3520" />
    </group>
  );
}

function Bookcase({ side }: { side: 1 | -1 }) {
  const books = useMemo(() => {
    const rand = seeded(side === 1 ? 3 : 4);
    const palette = [
      "#2F4A3A",
      "#6E1F1F",
      "#1F2A44",
      "#C9B38A",
      "#5B4632",
      "#3B3B3B",
      "#7A5C28",
      "#8C6B4A",
      "#E4D9C3",
    ];
    const items: {
      position: [number, number, number];
      scale: [number, number, number];
      color: string;
      rotation: [number, number, number];
    }[] = [];
    const x = side * (HALF - 0.3);
    for (const shelfY of [0.55, 1.45, 2.35, 3.25, 4.15]) {
      let zz = -2.2;
      while (zz > -13.8) {
        const w = 0.05 + rand() * 0.07;
        const h = 0.32 + rand() * 0.14;
        const lean = rand() < 0.06 ? side * 0.25 : 0;
        if (rand() > 0.05) {
          items.push({
            position: [x, shelfY + h / 2, zz - w / 2],
            scale: [0.36, h, w],
            rotation: [lean, 0, 0],
            color: palette[Math.floor(rand() * palette.length)],
          });
        }
        zz -= w + 0.008;
      }
    }
    return items;
  }, [side]);

  const x = side * (HALF - 0.02);
  return (
    <group>
      <Block position={[x, 2.4, -8]} size={[0.06, 4.8, 12]} color="#3a2b1d" />
      {[0.5, 1.4, 2.3, 3.2, 4.1, 4.75].map((y) => (
        <Block
          key={y}
          position={[side * (HALF - 0.28), y, -8]}
          size={[0.5, 0.06, 12]}
          color="#4a3826"
        />
      ))}
      {[-2, -5, -8, -11, -14].map((zz) => (
        <Block
          key={zz}
          position={[side * (HALF - 0.28), 2.4, zz]}
          size={[0.5, 4.8, 0.08]}
          color="#4a3826"
        />
      ))}
      <InstancedBoxes items={books} />
    </group>
  );
}

function Window({ x }: { x: number }) {
  const beam = useMemo(() => beamTexture(), []);
  return (
    <group>
      <mesh position={[x, 3.7, BACK + 0.03]}>
        <planeGeometry args={[2.1, 3.8]} />
        <meshBasicMaterial color="#FFF9EC" toneMapped={false} fog={false} />
      </mesh>
      <Block position={[x, 3.7, BACK + 0.06]} size={[0.06, 3.8, 0.04]} color="#d9ccb1" />
      <Block position={[x, 4.3, BACK + 0.06]} size={[2.1, 0.06, 0.04]} color="#d9ccb1" />
      <Block position={[x, 3.0, BACK + 0.06]} size={[2.1, 0.06, 0.04]} color="#d9ccb1" />
      {/* shaft of morning light falling into the room */}
      <Glow
        map={beam}
        position={[x * 0.8, 2.3, BACK + 4.2]}
        rotation={[-1.05, 0, 0]}
        scale={[2.2, 9]}
        color="#FFE7B8"
        opacity={0.42}
      />
      <Glow
        position={[x * 0.7, 0.02, BACK + 6.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[3, 4.2]}
        color="#FFE9C4"
        opacity={0.35}
      />
    </group>
  );
}

export function OldMoneyRoom({ z }: { z: number }) {
  return (
    <group position={[0, 0, z]}>
      <Shell wallTop="#F6F1E6" wallBottom="#D9CCB4" floor="#8a6a45" ceiling="#EDE5D6" />

      <Bookcase side={-1} />
      <Bookcase side={1} />
      <Window x={-3.6} />
      <Window x={3.6} />

      {/* rug, chairs, a side table with a lamp */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -8]}>
        <planeGeometry args={[5.4, 7.4]} />
        <meshBasicMaterial color="#7A5C28" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, -8]}>
        <planeGeometry args={[5, 7]} />
        <meshBasicMaterial color="#2F4A3A" />
      </mesh>
      <Armchair position={[-1.7, 0, -8.8]} rotation={0.7} />
      <Armchair position={[1.7, 0, -8.8]} rotation={-0.7} />
      <mesh position={[0, 0.32, -9.6]}>
        <cylinderGeometry args={[0.32, 0.32, 0.64, 24]} />
        <meshBasicMaterial color="#3a2b1d" />
      </mesh>
      <mesh position={[0, 1.06, -9.6]}>
        <coneGeometry args={[0.26, 0.3, 20, 1, true]} />
        <meshBasicMaterial color="#F3E3C3" side={DoubleSide} toneMapped={false} />
      </mesh>
      <Block position={[0, 0.8, -9.6]} size={[0.03, 0.34, 0.03]} color="#7A5C28" />
      <Glow position={[0, 1.05, -9.45]} scale={[1.4, 1.4]} color="#FFD9A0" opacity={0.7} />

      {/* paintings above the shelves */}
      <Frame
        position={[-HALF + 0.04, 5.75, -5]}
        rotation={[0, Math.PI / 2, 0]}
        size={[1.1, 1.5]}
        bg="#E7DCC7"
        accent="#7A5C28"
        frame="#5b4632"
        label="HEIRLOOM OVERSHIRT"
      />
      <Frame
        position={[HALF - 0.04, 5.75, -11]}
        rotation={[0, -Math.PI / 2, 0]}
        size={[1.1, 1.5]}
        bg="#E7DCC7"
        accent="#2F4A3A"
        frame="#5b4632"
        label="CABLE KNIT POLO"
      />

      <Glow position={[0, 1.7, BACK + 0.05]} scale={[2.6, 3.6]} color="#E8833A" opacity={0.35} />
    </group>
  );
}

/* ---------------------------------------------------------------------------
 * 04 RIDING: the highway at night
 * ------------------------------------------------------------------------- */

const DASH_GAP = 6;
const LIGHT_GAP = 14;

export function RidingRoom({ z }: { z: number }) {
  const dashes = useRef<Group>(null);
  const lights = useRef<Group>(null);
  const sky = useMemo(() => gradientTexture("#0D0F10", "#4A2A14"), []);

  const dashItems = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        position: [0, 0.02, 8 - i * DASH_GAP] as [number, number, number],
        scale: [0.14, 0.01, 2.4] as [number, number, number],
        color: "#C9C2B6",
      })),
    [],
  );

  const poles = useMemo(() => {
    const items: {
      position: [number, number, number];
      scale: [number, number, number];
      color: string;
    }[] = [];
    for (let i = 0; i < 12; i++) {
      const zz = 6 - i * LIGHT_GAP;
      for (const s of [-1, 1]) {
        items.push({ position: [s * 5.4, 3, zz], scale: [0.09, 6, 0.09], color: "#1b1e21" });
        items.push({ position: [s * 4.85, 6, zz], scale: [1.2, 0.07, 0.07], color: "#1b1e21" });
      }
    }
    return items;
  }, []);

  const { lampHeads, lampGlows, lampPools } = useMemo(() => {
    const zs = Array.from({ length: 12 }, (_, i) => 6 - i * LIGHT_GAP);
    const sides = [-1, 1];
    return {
      lampHeads: zs.flatMap((zz) =>
        sides.map((s) => ({
          position: [s * 4.3, 5.92, zz] as [number, number, number],
          scale: [0.45, 0.08, 0.22] as [number, number, number],
          color: "#FFC48A",
        })),
      ),
      lampGlows: zs.flatMap((zz) =>
        sides.map((s) => ({
          position: [s * 4.3, 5.7, zz + 0.12] as [number, number, number],
          scale: [2.4, 2.4] as [number, number],
        })),
      ),
      lampPools: zs.flatMap((zz) =>
        sides.map((s) => ({
          position: [s * 3.2, 0.03, zz] as [number, number, number],
          scale: [4.2, 5.4] as [number, number],
          rotation: [-Math.PI / 2, 0, 0] as [number, number, number],
        })),
      ),
    };
  }, []);

  const city = useMemo(() => {
    const rand = seeded(5);
    const n = 260;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (rand() - 0.5) * 140;
      pos[i * 3 + 1] = rand() * rand() * 5;
      pos[i * 3 + 2] = -150 - rand() * 20;
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(pos, 3));
    return g;
  }, []);
  useEffect(() => () => city.dispose(), [city]);

  // the road rolls past: dashes and streetlights loop, so it feels like riding
  useFrame((state) => {
    const t = state.clock.elapsedTime * 7;
    if (dashes.current) dashes.current.position.z = t % DASH_GAP;
    if (lights.current) lights.current.position.z = t % LIGHT_GAP;
  });

  return (
    <group position={[0, 0, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -70]}>
        <planeGeometry args={[80, 170]} />
        <meshBasicMaterial color="#0b0d0e" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -70]}>
        <planeGeometry args={[7.2, 170]} />
        <meshBasicMaterial color="#16191b" />
      </mesh>
      {[-3.35, 3.35].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.012, -70]}>
          <planeGeometry args={[0.08, 170]} />
          <meshBasicMaterial color="#6f7378" />
        </mesh>
      ))}

      <group ref={dashes}>
        <InstancedBoxes items={dashItems} />
      </group>

      <group ref={lights}>
        <InstancedBoxes items={poles} />
        <InstancedBoxes items={lampHeads} />
        <InstancedGlows items={lampGlows} color="#E8833A" opacity={0.85} />
        <InstancedGlows items={lampPools} color="#E8833A" opacity={0.3} />
      </group>

      {/* sky and the city glowing on the horizon */}
      <mesh position={[0, 70, -168]}>
        <planeGeometry args={[900, 150]} />
        <meshBasicMaterial map={sky} fog={false} />
      </mesh>
      <Glow position={[0, 2, -160]} scale={[420, 30]} color="#E8833A" opacity={0.5} />
      <points geometry={city}>
        <pointsMaterial
          size={0.35}
          color="#FFC48A"
          sizeAttenuation
          transparent
          opacity={0.85}
          fog={false}
        />
      </points>

      {/* roadside billboards */}
      <Frame
        position={[-6.6, 3.2, -10]}
        rotation={[0, 0.55, 0]}
        size={[1.8, 2.45]}
        bg="#141210"
        accent="#E8833A"
        frame="#08090a"
        label="NIGHTFALL RIDING JACKET"
      />
      <Frame
        position={[6.6, 3.2, -22]}
        rotation={[0, -0.55, 0]}
        size={[1.8, 2.45]}
        bg="#141210"
        accent="#E8833A"
        frame="#08090a"
        label="ARMOURED DENIM"
      />
    </group>
  );
}
