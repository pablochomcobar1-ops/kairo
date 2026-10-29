import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { IntroScript } from "@/components/layout/IntroScript";

describe("IntroScript", () => {
  it("is plain data when React renders it in the browser (no script-tag warning)", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(<IntroScript />);
    const warned = spy.mock.calls.some((c) => String(c[0]).includes("script tag"));
    spy.mockRestore();
    expect(warned).toBe(false);
    expect(container.querySelector("script")?.getAttribute("type")).toBe("application/json");
  });

  it("is a real script in the server HTML, so it runs before first paint", () => {
    const g = globalThis as { window?: unknown };
    const saved = g.window;
    delete g.window;
    try {
      expect(renderToString(<IntroScript />).startsWith("<script>")).toBe(true);
    } finally {
      g.window = saved;
    }
  });
});
