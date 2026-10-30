import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

const { limit, memoryStore, resetMemoryStore, upstashStore, LIMITS } =
  await import("@/server/ratelimit");
const { verifyTurnstile } = await import("@/server/turnstile");

describe("limit()", () => {
  beforeEach(() => resetMemoryStore());

  it("login: 5 tries per 10 minutes per IP, then a wait", async () => {
    for (let i = 0; i < 5; i++) expect((await limit("auth", "1.2.3.4", memoryStore)).ok).toBe(true);
    const sixth = await limit("auth", "1.2.3.4", memoryStore);
    expect(sixth.ok).toBe(false);
    expect(sixth.retryAfterSec).toBeGreaterThan(500);
  });

  it("different IPs and different buckets don't share a count", async () => {
    for (let i = 0; i < 3; i++) await limit("contact", "1.1.1.1", memoryStore);
    expect((await limit("contact", "1.1.1.1", memoryStore)).ok).toBe(false);
    expect((await limit("contact", "2.2.2.2", memoryStore)).ok).toBe(true);
    expect((await limit("review", "1.1.1.1", memoryStore)).ok).toBe(true);
  });

  it("matches the security plan's numbers", () => {
    expect(LIMITS.auth).toEqual({ max: 5, windowSec: 600 });
    expect(LIMITS.coupon).toEqual({ max: 10, windowSec: 60 });
  });

  it("refuses in production when no store is configured", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await limit("auth", "1.2.3.4", null);
    expect(r).toMatchObject({ ok: false, reason: "unavailable" });
    spy.mockRestore();
  });
});

describe("Upstash store", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends INCR + EXPIRE NX + TTL with the token, and never the raw IP", async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify([{ result: 6 }, { result: 0 }, { result: 420 }])),
    );
    vi.stubGlobal("fetch", fetchMock);
    const r = await limit("auth", "9.9.9.9", upstashStore("https://eu1.upstash.io/", "tok"));
    expect(r).toEqual({ ok: false, retryAfterSec: 420, reason: "limited" });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://eu1.upstash.io/pipeline");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    const body = String(init.body);
    expect(body).toContain('"INCR"');
    expect(body).toContain('"NX"');
    expect(body).not.toContain("9.9.9.9");
  });

  it("lets the request through if Upstash is down", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("boom", { status: 500 })),
    );
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await limit("auth", "x", upstashStore("https://u.io", "t"))).ok).toBe(true);
    spy.mockRestore();
  });
});

describe("verifyTurnstile()", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("asks Cloudflare and trusts only success: true", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ success: true })));
    vi.stubGlobal("fetch", fetchMock);
    expect(await verifyTurnstile("a-valid-looking-token", "1.2.3.4")).toBe(true);
    const body = String((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body);
    expect(body).toContain("remoteip=1.2.3.4");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ success: false }))),
    );
    expect(await verifyTurnstile("a-valid-looking-token")).toBe(false);
  });

  it("a missing token fails without calling Cloudflare", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await verifyTurnstile(undefined)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("no secret: skipped in development, refused in production", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(await verifyTurnstile(undefined)).toBe(true);
    vi.stubEnv("NODE_ENV", "production");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await verifyTurnstile("whatever-token-here")).toBe(false);
    spy.mockRestore();
  });
});
