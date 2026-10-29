import { describe, expect, it } from "vitest";
import { dropDateIST, timeLeft, weekdayIST } from "@/lib/countdown";

const now = new Date("2026-11-01T10:00:00Z");

describe("timeLeft", () => {
  it("2 days 3 hours before", () => {
    const target = new Date(now.getTime() + (2 * 86_400 + 3 * 3_600) * 1000);
    expect(timeLeft(target, now)).toEqual({
      days: 2,
      hours: 3,
      minutes: 0,
      seconds: 0,
      done: false,
    });
  });

  it("counts minutes and seconds", () => {
    const target = new Date(now.getTime() + (59 * 60 + 7) * 1000 + 400);
    expect(timeLeft(target, now)).toEqual({
      days: 0,
      hours: 0,
      minutes: 59,
      seconds: 7,
      done: false,
    });
  });

  it("past or exactly now → all zero and done", () => {
    const zero = { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
    expect(timeLeft(new Date(now.getTime() - 5000), now)).toEqual(zero);
    expect(timeLeft(now, now)).toEqual(zero);
  });

  it("an invalid date counts as done instead of showing NaN", () => {
    expect(timeLeft(new Date("nope"), now).done).toBe(true);
  });
});

describe("IST labels", () => {
  it("uses India time, not the server's", () => {
    // 20:00 UTC Thursday is 01:30 Friday in India
    expect(weekdayIST("2026-11-05T20:00:00Z")).toBe("Friday");
    expect(dropDateIST("2026-11-05T20:00:00Z")).toBe("Fri 6 Nov, 1:30 am IST");
  });
});
