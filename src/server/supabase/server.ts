import "server-only";
import { createServerClient as createSsrClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/db";

/**
 * The session cookie can't be read by page scripts (httpOnly), only travels
 * over HTTPS in production (Secure) and isn't sent on cross-site requests
 * (SameSite=Lax). Nothing in the browser reads it: the site asks the server.
 */
export const SESSION_COOKIE = {
  httpOnly: true,
  secure:
    process.env.NODE_ENV === "production" &&
    !process.env.NEXT_PUBLIC_SITE_URL?.startsWith("http://"),
  sameSite: "lax",
  path: "/",
} as const;

/**
 * Supabase as the current visitor. Uses their session cookie, so Row Level
 * Security applies: they see exactly what the policies allow, nothing more.
 * Use this for everything a shopper does.
 */
export async function createServerClient() {
  const env = publicEnv();
  const cookieStore = await cookies();

  return createSsrClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, { ...options, ...SESSION_COOKIE });
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The session is refreshed in the proxy instead, so this is safe to ignore.
          }
        },
      },
    },
  );
}
