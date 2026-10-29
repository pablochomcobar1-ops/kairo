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

describe("Reveal under reduced motion", () => {
  it("always animates the position back to zero, even when the server drew it lowered", async () => {
    const { Reveal } = await import("@/components/motion/Reveal");
    const { readFileSync } = await import("node:fs");
    // whileInView must carry the transform target, or reduced-motion visitors get stuck offset
    const src = readFileSync("src/components/motion/Reveal.tsx", "utf8");
    expect(src).toMatch(/whileInView=\{\{ opacity: 1, transform: "translateY\(0px\)" \}\}/);
    render(<Reveal>hello</Reveal>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});
