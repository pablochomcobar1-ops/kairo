import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// three.js never loads in these tests: if the hero ever tried to, this would throw
vi.mock("@/components/three/SilkCanvas", () => ({
  default: () => {
    throw new Error("WebGL canvas should not load here");
  },
}));

const device = vi.hoisted(() => ({
  value: { width: 1440, reducedMotion: false, webgl: true, saveData: false, memoryGb: 8, cores: 8 },
}));
vi.mock("@/lib/three/capability", async (orig) => ({
  ...(await orig<typeof import("@/lib/three/capability")>()),
  readDevice: () => device.value,
}));

const { SilkHero } = await import("@/components/three/SilkHero");

describe("SilkHero", () => {
  afterEach(() => {
    device.value = { width: 1440, reducedMotion: false, webgl: true, saveData: false, memoryGb: 8, cores: 8 };
  });

  it.each([
    ["no WebGL", { webgl: false }],
    ["reduced motion", { reducedMotion: true }],
    ["data saver", { saveData: true }],
  ])("shows the still silk, never an empty box, with %s", async (_, change) => {
    device.value = { ...device.value, ...change };
    const { container } = render(<SilkHero />);
    expect(screen.getByRole("img", { name: /silk fabric/i })).toBeInTheDocument();
    // give the idle callback a chance to run, then confirm WebGL never mounted
    await new Promise((r) => setTimeout(r, 300));
    await waitFor(() => expect(container.querySelector("canvas")).toBeNull());
  });

  it("has the still silk in the server HTML before anything else runs", () => {
    render(<SilkHero />);
    expect(screen.getByRole("img", { name: /silk fabric/i })).toBeInTheDocument();
  });
});
