import { CanvasTexture, LinearFilter, SRGBColorSpace, type Texture } from "three";

/**
 * Small textures drawn in code once and shared: no image downloads.
 * Lighting in the rooms is "baked" into these gradients and glows instead of
 * computed live, which keeps every room cheap on the GPU.
 */

const cache = new Map<string, Texture>();

function make(key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): Texture {
  const hit = cache.get(key);
  if (hit) return hit;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  draw(ctx);
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  tex.minFilter = LinearFilter;
  tex.generateMipmaps = false;
  cache.set(key, tex);
  return tex;
}

/** Soft round glow (white; tinted by the material colour). Used additively for lamps, neon, light pools. */
export function glowTexture(): Texture {
  return make("glow", 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.55)");
    g.addColorStop(0.6, "rgba(255,255,255,0.12)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });
}

/** Vertical gradient, top colour to bottom colour: walls lit from above, skies, shafts of light. */
export function gradientTexture(top: string, bottom: string): Texture {
  return make(`grad:${top}:${bottom}`, 4, 256, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
  });
}

/** A beam of light that fades along its length (window shafts). */
export function beamTexture(): Texture {
  return make("beam", 64, 256, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 256);
    // soft sides
    const side = ctx.createLinearGradient(0, 0, 64, 0);
    side.addColorStop(0, "rgba(0,0,0,1)");
    side.addColorStop(0.3, "rgba(0,0,0,0)");
    side.addColorStop(0.7, "rgba(0,0,0,0)");
    side.addColorStop(1, "rgba(0,0,0,1)");
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = side;
    ctx.fillRect(0, 0, 64, 256);
  });
}

/** Stand-in for a product photo until the shoot (Task 13): a lit backdrop in the room's colours. */
export function posterTexture(bg: string, accent: string, label: string): Texture {
  return make(`poster:${bg}:${accent}:${label}`, 256, 352, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 352);
    const g = ctx.createRadialGradient(170, 90, 10, 170, 90, 260);
    g.addColorStop(0, accent);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 352);
    ctx.globalAlpha = 1;
    // garment silhouette: shoulders, body, sleeves
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.beginPath();
    ctx.moveTo(88, 96);
    ctx.lineTo(168, 96);
    ctx.lineTo(214, 150);
    ctx.lineTo(194, 168);
    ctx.lineTo(176, 150);
    ctx.lineTo(176, 290);
    ctx.lineTo(80, 290);
    ctx.lineTo(80, 150);
    ctx.lineTo(62, 168);
    ctx.lineTo(42, 150);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.font = "600 14px monospace";
    ctx.fillText(label, 18, 334);
  });
}
