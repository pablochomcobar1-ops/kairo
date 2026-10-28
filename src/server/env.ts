import "server-only";
import { z } from "zod";

/**
 * Secret settings — server only. The `server-only` import makes the build fail
 * if any browser code ever imports this file, so these can't leak to visitors.
 */
const serverSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(20),
});

export type ServerEnv = z.infer<typeof serverSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverSchema.safeParse({
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  });
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Missing or invalid server settings in .env.local: ${missing}`);
  }
  cached = parsed.data;
  return cached;
}
