import { afterEach, describe, expect, it, vi } from "vitest";

describe("publicEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("names the missing setting instead of failing silently", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    const { publicEnv } = await import("@/lib/env");
    expect(() => publicEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("accepts a complete set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcd.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_1234567890abcdef");
    const { publicEnv } = await import("@/lib/env");
    expect(publicEnv().NEXT_PUBLIC_SUPABASE_URL).toBe("https://abcd.supabase.co");
    expect(publicEnv().NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
  });
});
