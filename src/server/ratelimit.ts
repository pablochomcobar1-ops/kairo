import "server-only";
import { headers } from "next/headers";

/**
 * Rate limits (security plan A7). Fixed windows counted in Upstash Redis
 * through its REST API, so no extra package is needed. IP addresses are
 * hashed before they are used as keys: Upstash never sees a raw IP.
 *
 * Without Upstash keys: on your PC (development) counts are kept in memory;
 * in production the limiter refuses to run silently and logs loudly.
 * If Upstash itself is unreachable, requests are let through (and logged):
 * a Redis hiccup shouldn't lock every shopper out.
 */

export type Bucket = "auth" | "contact" | "review" | "alert" | "coupon" | "checkout" | "track";

export const LIMITS: Record<Bucket, { max: number; windowSec: number }> = {
  auth: { max: 5, windowSec: 600 },
  contact: { max: 3, windowSec: 600 },
  review: { max: 3, windowSec: 600 },
  alert: { max: 3, windowSec: 600 },
  coupon: { max: 10, windowSec: 60 },
  checkout: { max: 10, windowSec: 600 },
  track: { max: 10, windowSec: 600 },
};

export type LimitResult = {
  ok: boolean;
  retryAfterSec: number;
  /** "unavailable" = limits aren't configured in production, so the form is switched off */
  reason?: "limited" | "unavailable";
};

type Store = (key: string, windowSec: number) => Promise<{ count: number; ttlSec: number }>;

// ---------- in-memory (development only) ----------
const memory = new Map<string, { count: number; resetAt: number }>();
export const memoryStore: Store = async (key, windowSec) => {
  const now = Date.now();
  const hit = memory.get(key);
  if (!hit || hit.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { count: 1, ttlSec: windowSec };
  }
  hit.count += 1;
  return { count: hit.count, ttlSec: Math.ceil((hit.resetAt - now) / 1000) };
};
export const resetMemoryStore = () => memory.clear();

// ---------- Upstash REST ----------
export function upstashStore(url: string, token: string): Store {
  return async (key, windowSec) => {
    const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(windowSec), "NX"],
        ["TTL", key],
      ]),
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) throw new Error(`Upstash answered ${res.status}`);
    const [incr, , ttl] = (await res.json()) as { result?: number; error?: string }[];
    if (incr?.error || typeof incr?.result !== "number")
      throw new Error(`Upstash: ${incr?.error ?? "bad reply"}`);
    return {
      count: incr.result,
      ttlSec: typeof ttl?.result === "number" && ttl.result > 0 ? ttl.result : windowSec,
    };
  };
}

function pickStore(): Store | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return upstashStore(url, token);
  // in-memory counts: development, or `KAIRO_RATELIMIT=memory` to try a production build on your PC
  if (process.env.NODE_ENV !== "production" || process.env.KAIRO_RATELIMIT === "memory")
    return memoryStore;
  return null;
}

async function sha256(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes).slice(0, 12), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

/** Count one attempt for this bucket and key. `ok: false` means "too many, wait retryAfterSec". */
export async function limit(
  bucket: Bucket,
  key: string,
  store: Store | null = pickStore(),
): Promise<LimitResult> {
  const { max, windowSec } = LIMITS[bucket];
  if (!store) {
    console.error(
      "[ratelimit] UPSTASH_REDIS_REST_URL / _TOKEN are not set in production: refusing the request",
    );
    return { ok: false, retryAfterSec: 0, reason: "unavailable" };
  }
  try {
    const { count, ttlSec } = await store(`kairo:rl:${bucket}:${await sha256(key)}`, windowSec);
    return count > max
      ? { ok: false, retryAfterSec: Math.max(1, ttlSec), reason: "limited" }
      : { ok: true, retryAfterSec: 0 };
  } catch (err) {
    console.error(
      "[ratelimit] store unavailable, letting the request through:",
      err instanceof Error ? err.message : err,
    );
    return { ok: true, retryAfterSec: 0 };
  }
}

/** The visitor's IP as Vercel reports it (first address in x-forwarded-for). */
export async function clientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || h.get("x-real-ip")?.trim() || "local";
}

/** What to tell the visitor when limit() says no. */
export function tooMany(result: LimitResult): string {
  if (result.reason === "unavailable")
    return "This form is switched off for a moment. Please try again later.";
  const { retryAfterSec } = result;
  const minutes = Math.ceil(retryAfterSec / 60);
  return retryAfterSec < 90
    ? "Too many tries. Please wait a minute and try again."
    : `Too many tries. Please wait about ${minutes} minutes and try again.`;
}
