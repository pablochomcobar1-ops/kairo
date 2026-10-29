import { describe, expect, it } from "vitest";
import { pickJourneyMode, pickSilkMode } from "@/lib/three/capability";
import { ROOM_COUNT, activeRoomAt, cameraZAt, roomViewZ } from "@/components/three/journey/path";
import { SILK, THEMES } from "@/lib/theme";

const strong = { width: 1440, reducedMotion: false, webgl: true, saveData: false, memoryGb: 8, cores: 8 };

describe("pickJourneyMode", () => {
  it("uses full 3D on a capable desktop", () => {
    expect(pickJourneyMode(strong)).toBe("3d");
  });

  it.each([
    ["phones and small tablets", { width: 767 }],
    ["reduced motion", { reducedMotion: true }],
    ["no WebGL", { webgl: false }],
    ["data saver", { saveData: true }],
    ["low memory", { memoryGb: 2 }],
    ["few CPU cores", { cores: 2 }],
  ])("falls back to 2.5D for %s", (_, change) => {
    expect(pickJourneyMode({ ...strong, ...change })).toBe("2.5d");
  });

  it("does not punish browsers that hide memory/cores", () => {
    expect(pickJourneyMode({ ...strong, memoryGb: undefined, cores: undefined })).toBe("3d");
  });
});

describe("pickSilkMode", () => {
  it("runs on phones too, with a lighter mesh", () => {
    expect(pickSilkMode({ ...strong, width: 390 })).toBe("lite");
    expect(pickSilkMode(strong)).toBe("full");
  });

  it("shows the still image without WebGL, under reduced motion or data saver", () => {
    expect(pickSilkMode({ ...strong, webgl: false })).toBe("still");
    expect(pickSilkMode({ ...strong, reducedMotion: true })).toBe("still");
    expect(pickSilkMode({ ...strong, saveData: true })).toBe("still");
  });
});

describe("journey camera path", () => {
  it("starts in front of the first room and ends in the last", () => {
    expect(cameraZAt(0)).toBeCloseTo(roomViewZ(0), 5);
    expect(cameraZAt(1)).toBeCloseTo(roomViewZ(ROOM_COUNT - 1) - 2, 1);
  });

  it("never jumps: a tiny scroll moves the camera a tiny amount", () => {
    let prev = cameraZAt(0);
    for (let i = 1; i <= 2000; i++) {
      const z = cameraZAt(i / 2000);
      expect(Math.abs(z - prev)).toBeLessThan(0.6);
      prev = z;
    }
  });

  it("only ever moves forward", () => {
    let prev = cameraZAt(0);
    for (let i = 1; i <= 400; i++) {
      const z = cameraZAt(i / 400);
      expect(z).toBeLessThanOrEqual(prev + 1e-9);
      prev = z;
    }
  });

  it("is in each room for a fair share of the scroll", () => {
    const counts = [0, 0, 0, 0];
    for (let i = 0; i <= 1000; i++) counts[activeRoomAt(i / 1000)]++;
    for (const c of counts) expect(c).toBeGreaterThan(180);
  });

  it("clamps progress outside 0..1", () => {
    expect(activeRoomAt(-0.5)).toBe(0);
    expect(activeRoomAt(1.5)).toBe(ROOM_COUNT - 1);
  });
});

describe("silk palette", () => {
  it("has a light for every theme", () => {
    for (const name of Object.keys(THEMES)) {
      expect(SILK[name as keyof typeof SILK].light).toMatch(/^#[0-9A-F]{6}$/);
    }
  });
});
