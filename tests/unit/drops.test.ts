import { describe, expect, it, vi } from "vitest";
import { dropPhase, splitDropName } from "@/lib/drops";

vi.mock("server-only", () => ({}));
const { fixturesSource } = await import("@/server/catalog/fixtures");

const now = Date.parse("2026-11-05T12:00:00Z");

describe("drops", () => {
  it("knows upcoming, live and closed", () => {
    expect(dropPhase({ startsAt: "2026-11-06T00:00:00Z", endsAt: null }, now)).toBe("upcoming");
    expect(dropPhase({ startsAt: "2026-11-01T00:00:00Z", endsAt: null }, now)).toBe("live");
    expect(
      dropPhase({ startsAt: "2026-11-01T00:00:00Z", endsAt: "2026-11-05T12:00:00Z" }, now),
    ).toBe("closed");
  });

  it("splits a drop's name", () => {
    expect(splitDropName("Drop 01 — Night Shift")).toEqual({
      label: "Drop 01",
      title: "Night Shift",
    });
    expect(splitDropName("Monsoon")).toEqual({ label: "Drop", title: "Monsoon" });
  });

  it("fixture drops carry their pieces", async () => {
    const drops = await fixturesSource.getDrops();
    expect(drops[0].slug).toBe("drop-01-night-shift");
    expect(drops[0].products.length).toBeGreaterThan(0);
    expect(drops[0].products.every((p) => p.dropSlug === "drop-01-night-shift")).toBe(true);
  });
});
