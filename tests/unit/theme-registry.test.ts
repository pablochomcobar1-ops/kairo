import { describe, expect, it } from "vitest";
import { currentTheme, pushTheme, THEME_EVENT } from "@/components/layout/ThemeSignal";

describe("theme registry (what is actually on screen)", () => {
  it("is Noir with nothing registered", () => {
    expect(currentTheme()).toBe("noir");
  });

  it("follows the newest visible page, whatever order pages hide in", () => {
    const hideRiding = pushTheme("riding");
    const hideOldMoney = pushTheme("old-money");
    expect(document.documentElement.dataset.theme).toBe("old-money");

    // the previous page hides AFTER the new one showed (Next keeps it mounted, then hides it)
    hideRiding();
    expect(document.documentElement.dataset.theme).toBe("old-money");

    hideOldMoney();
    expect(document.documentElement.dataset.theme).toBe("noir");
  });

  it("switches CSS from server markers to the registry", () => {
    const hide = pushTheme("formal");
    expect(document.documentElement.classList.contains("js-theme")).toBe(true);
    hide();
  });

  it("tells the 3D canvas when the theme changes, and only then", () => {
    const seen: string[] = [];
    const listener = (e: Event) => seen.push((e as CustomEvent<{ theme: string }>).detail.theme);
    window.addEventListener(THEME_EVENT, listener);
    const a = pushTheme("street");
    const b = pushTheme("street");
    b();
    a();
    window.removeEventListener(THEME_EVENT, listener);
    expect(seen).toEqual(["street", "noir"]);
  });
});
