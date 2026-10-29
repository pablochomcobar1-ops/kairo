import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/db";

/**
 * Supabase as an anonymous visitor, with no cookies. Row Level Security
 * applies (published catalog only). Because it reads no cookies it can be
 * used inside cached functions, so catalog pages are served from cache.
 */
export function createPublicClient() {
  const env = publicEnv();
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    },
  );
}
