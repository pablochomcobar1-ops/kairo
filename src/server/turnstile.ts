import "server-only";

/**
 * Cloudflare Turnstile: checks the token the invisible widget put in the form.
 * Tokens are single-use and expire after 5 minutes. On your PC without keys
 * the check is skipped; in production a missing secret means "not verified".
 */
export async function verifyTurnstile(token: unknown, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV !== "production") return true;
    console.error("[turnstile] TURNSTILE_SECRET_KEY is not set in production");
    return false;
  }
  if (typeof token !== "string" || token.length < 10 || token.length > 2048) return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "local") body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    console.error("[turnstile] verify failed:", err instanceof Error ? err.message : err);
    return false;
  }
}
