import { describe, expect, it } from "vitest";
import { cn } from "@/lib/cn";

describe("test runner", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});

describe("cn", () => {
  it("keeps a colour and a custom text size together", () => {
    expect(cn("text-accent", "text-hero01")).toBe("text-accent text-hero01");
  });

  it("lets a later custom size win over an earlier one", () => {
    expect(cn("text-hero01", "text-heading02")).toBe("text-heading02");
  });

  it("drops falsy values", () => {
    expect(cn("px-4", false, undefined, "py-2")).toBe("px-4 py-2");
  });
});
