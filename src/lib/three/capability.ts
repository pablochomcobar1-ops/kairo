/**
 * Decides how much 3D a device gets. Pure functions (tested) plus one
 * browser probe. A weak or careful device never gets a blank space: it gets
 * the 2.5D journey or the still silk instead.
 */

export interface DeviceInfo {
  width: number;
  reducedMotion: boolean;
  webgl: boolean;
  saveData: boolean;
  /** navigator.deviceMemory (GB); undefined where the browser hides it (Safari, Firefox) */
  memoryGb?: number;
  /** navigator.hardwareConcurrency; undefined where hidden */
  cores?: number;
}

export type JourneyMode = "3d" | "2.5d";
export type SilkMode = "full" | "lite" | "still";

const DESKTOP_MIN_WIDTH = 768;

function weakHardware(d: DeviceInfo) {
  return (d.memoryGb !== undefined && d.memoryGb < 4) || (d.cores !== undefined && d.cores < 4);
}

/** The Four Wardrobes: full 3D only on capable, wide screens. */
export function pickJourneyMode(d: DeviceInfo): JourneyMode {
  if (d.width < DESKTOP_MIN_WIDTH || d.reducedMotion || !d.webgl || d.saveData || weakHardware(d)) {
    return "2.5d";
  }
  return "3d";
}

/** The silk hero: runs on phones too, with a lighter mesh; still image when it shouldn't run. */
export function pickSilkMode(d: DeviceInfo): SilkMode {
  if (!d.webgl || d.reducedMotion || d.saveData) return "still";
  if (d.width < DESKTOP_MIN_WIDTH || weakHardware(d)) return "lite";
  return "full";
}

/** Reads the current browser. Call only in the browser (effects). */
export function readDevice(): DeviceInfo {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  return {
    width: window.innerWidth,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    webgl: hasWebGL(),
    saveData: Boolean(nav.connection?.saveData),
    memoryGb: nav.deviceMemory,
    cores: nav.hardwareConcurrency || undefined,
  };
}

let webglCache: boolean | undefined;

export function hasWebGL(): boolean {
  if (webglCache !== undefined) return webglCache;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    webglCache = Boolean(gl);
    // free the probe context right away
    (gl as WebGLRenderingContext | null)?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglCache = false;
  }
  return webglCache;
}
