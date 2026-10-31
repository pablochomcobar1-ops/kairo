"use server";

import { accountsEnabled } from "@/server/auth";
import { parseContact, sendContactCore } from "@/server/contact/core";
import { supabaseContactStore } from "@/server/contact/store";
import { fieldErrors } from "@/lib/validation";
import { clientIp, limit, tooMany } from "@/server/ratelimit";
import { verifyTurnstile } from "@/server/turnstile";
import type { FormState } from "./auth";

const str = (form: FormData, key: string, max: number) => {
  const v = form.get(key);
  return typeof v === "string" ? v.slice(0, max) : "";
};

/** The contact form. Field mistakes first (they don't use up a try), then the rate limit and bot check. */
export async function sendContactMessage(_prev: FormState, form: FormData): Promise<FormState> {
  const values = {
    name: str(form, "name", 130),
    email: str(form, "email", 260),
    phone: str(form, "phone", 20),
    message: str(form, "message", 4100),
  };
  const website = str(form, "website", 200);
  if (!accountsEnabled())
    return { status: "error", message: "The contact form isn't switched on here yet.", values };

  if (!website) {
    const parsed = parseContact(values);
    if (!parsed.success)
      return {
        status: "error",
        message: "Check the highlighted fields.",
        fields: fieldErrors(parsed.error),
        values,
      };
  }

  const ip = await clientIp();
  const rl = await limit("contact", ip);
  if (!rl.ok) return { status: "error", message: tooMany(rl), values };
  if (!(await verifyTurnstile(form.get("cf-turnstile-response"), ip)))
    return {
      status: "error",
      message: "We couldn't check you're human. Refresh the page and try again.",
      values,
    };

  try {
    const result = await sendContactCore(supabaseContactStore(), { ...values, website });
    if (result.status === "error")
      return { status: "error", message: result.message, fields: result.fields, values };
    return { status: "ok", message: result.message };
  } catch (err) {
    console.error("[contact] failed:", err instanceof Error ? err.message : err);
    return { status: "error", message: "Something went wrong. Please try again.", values };
  }
}
