"use server";

import { z } from "zod";
import { createAdminClient } from "@/server/supabase/admin";

export type DropAlertState = { status: "idle" | "ok" | "error"; message: string };

const schema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(254, "That email is too long.")
    .pipe(z.email("Enter an email like name@example.com.")),
  drop: z
    .string()
    .regex(/^[a-z0-9-]{1,80}$/)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  // honeypot: people never see this field, bots fill it in
  website: z.string().max(0).optional().or(z.literal("")),
});

const OK: DropAlertState = {
  status: "ok",
  message: "You're on the list. We'll email you when it opens.",
};

/**
 * "Notify me" for drops. Server Actions only accept same-origin posts (Next.js
 * checks the Origin header), the input is validated here, and the insert goes
 * through the server key with fixed columns. The reply is the same for a new
 * or an already-listed email, so nobody can test which emails are signed up.
 * Rate limiting and Turnstile are added with the other public forms in Task 8.
 */
export async function joinDropAlerts(
  _prev: DropAlertState,
  form: FormData,
): Promise<DropAlertState> {
  const parsed = schema.safeParse({
    email: form.get("email") ?? "",
    drop: form.get("drop") ?? "",
    website: form.get("website") ?? "",
  });

  if (!parsed.success) {
    const honeypot = parsed.error.issues.some((i) => i.path[0] === "website");
    if (honeypot) return OK; // don't tell bots they were caught
    const emailIssue = parsed.error.issues.find((i) => i.path[0] === "email");
    return {
      status: "error",
      message: emailIssue?.message ?? "Something in the form isn't right.",
    };
  }

  if (process.env.KAIRO_DATA === "fixtures") return OK;

  try {
    const db = createAdminClient();
    let dropId: string | null = null;
    if (parsed.data.drop) {
      const drop = await db.from("drops").select("id").eq("slug", parsed.data.drop).maybeSingle();
      if (drop.error) throw drop.error;
      dropId = drop.data?.id ?? null;
    }
    const { error } = await db
      .from("drop_alerts")
      .upsert(
        { email: parsed.data.email, drop_id: dropId },
        { onConflict: "email,drop_id", ignoreDuplicates: true },
      );
    if (error) throw error;
    return OK;
  } catch (err) {
    console.error("drop alert failed", err instanceof Error ? err.message : err);
    return {
      status: "error",
      message: "We couldn't save that just now. Please try again in a minute.",
    };
  }
}
