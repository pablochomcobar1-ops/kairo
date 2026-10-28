import "server-only";
import { createServerClient as createSsrClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicEnv } from "@/lib/env";

/**
 * Supabase as the current visitor. Uses their session cookie, so Row Level
 * Security applies: they see exactly what the policies allow, nothing more.
 * Use this for everything a shopper does.
 */
export async function createServerClient() {
  const env = publicEnv();
  const cookieStore = await cookies();

  return createSsrClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The session is refreshed in the proxy instead, so this is safe to ignore.
        }
      },
    },
  });
}
