/**
 * Where the camera is for a given scroll progress (0..1) through the
 * Four Wardrobes. Rooms sit one after another down the -Z axis. In each
 * room's share of the scroll the camera first lingers (a slow dolly), then
 * flies through the doorway to the next room's viewpoint.
 */

export const ROOM_COUNT = 4;
/** distance between room centres */
export const ROOM_SPACING = 40;
/** share of each room's scroll spent lingering before the fly-through */
const LINGER = 0.58;
/** how far the camera drifts forward while lingering */
const DOLLY = 2;

/** z of room i's centre */
export const roomZ = (i: number) => -i * ROOM_SPACING;
/** where the camera stands to look into room i */
export const roomViewZ = (i: number) => roomZ(i) + 7;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

function segment(p: number) {
  const s = clamp01(p) * ROOM_COUNT;
  const i = Math.min(ROOM_COUNT - 1, Math.floor(s));
  return { i, f: s - i };
}

export function cameraZAt(p: number): number {
  const { i, f } = segment(p);
  const start = roomViewZ(i);
  const lingerEnd = start - DOLLY * Math.min(f, LINGER) / LINGER;

  // last room: linger all the way
  if (i === ROOM_COUNT - 1) return start - DOLLY * f;
  if (f <= LINGER) return lingerEnd;

  const t = smooth((f - LINGER) / (1 - LINGER));
  return lingerEnd + (roomViewZ(i + 1) - lingerEnd) * t;
}

/** Which room's name, theme and button are showing. Switches mid-flight. */
export function activeRoomAt(p: number): number {
  const { i, f } = segment(p);
  if (i < ROOM_COUNT - 1 && f > LINGER + (1 - LINGER) / 2) return i + 1;
  return i;
}
