import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { INTRO_EVERY_MS, INTRO_SCRIPT } from "@/components/layout/Loader";

const run = () => new Function(INTRO_SCRIPT)();
const seen = () => document.documentElement.classList.contains("intro-seen");

describe("intro script", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("intro-seen");
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-29T06:00:00+05:30"));
  });
  afterEach(() => vi.useRealTimers());

  it("plays on the first visit", () => {
    run();
    expect(seen()).toBe(false);
  });

  it("is skipped on the next page, in any tab, within 12 hours", () => {
    run();
    document.documentElement.classList.remove("intro-seen");
    vi.advanceTimersByTime(INTRO_EVERY_MS - 60_000);
    run();
    expect(seen()).toBe(true);
  });

  it("plays again after 12 hours", () => {
    run();
    document.documentElement.classList.remove("intro-seen");
    vi.advanceTimersByTime(INTRO_EVERY_MS + 1);
    run();
    expect(seen()).toBe(false);
  });

  it("stays out of the way when storage is blocked", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    run();
    expect(seen()).toBe(true);
    spy.mockRestore();
  });

  it("contains a real number, not a leftover placeholder", () => {
    expect(INTRO_SCRIPT).toContain(String(INTRO_EVERY_MS));
    expect(INTRO_SCRIPT).not.toContain("${");
  });
});
