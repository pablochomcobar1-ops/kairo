import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/server/env";
import type { Database } from "@/types/db";

/**
 * Supabase with the secret key. It BYPASSES Row Level Security, so it is only
 * for server code that has already checked who is asking: creating orders,
 * confirming payments, saving reviews and contact messages, admin actions.
 * Never pass data from this client to the browser without choosing the fields.
 */
export function createAdminClient() {
  return createClient<Database>(
    publicEnv().NEXT_PUBLIC_SUPABASE_URL,
    serverEnv().SUPABASE_SECRET_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    },
  );
}
