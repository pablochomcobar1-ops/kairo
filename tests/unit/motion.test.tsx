import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { cssSeconds } from "@/components/motion/presets";
import { SplitText } from "@/components/motion/SplitText";

describe("cssSeconds", () => {
  afterEach(() => document.documentElement.style.removeProperty("--k-dur-reveal"));

  it("reads milliseconds and seconds from a CSS variable", () => {
    document.documentElement.style.setProperty("--k-dur-reveal", "1100ms");
    expect(cssSeconds("--k-dur-reveal", 0.9)).toBe(1.1);
    document.documentElement.style.setProperty("--k-dur-reveal", "0.45s");
    expect(cssSeconds("--k-dur-reveal", 0.9)).toBe(0.45);
  });

  it("falls back when the variable is missing", () => {
    expect(cssSeconds("--k-missing", 0.9)).toBe(0.9);
  });
});

describe("SplitText", () => {
  it("reads as one sentence to screen readers, not word by word", () => {
    render(<SplitText as="h1" text={"Four lives.\nOne label."} immediate />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveAccessibleName("Four lives. One label.");
  });
});
