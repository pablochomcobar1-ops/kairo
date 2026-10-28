"use client";

import { createBrowserClient as createSsrBrowserClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";

let client: ReturnType<typeof createSsrBrowserClient> | undefined;

/** Supabase in the browser, signed in as the current visitor (RLS applies). One shared instance. */
export function createBrowserClient() {
  if (client) return client;
  const env = publicEnv();
  client = createSsrBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  return client;
}
