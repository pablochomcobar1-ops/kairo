"use server";

import { fieldErrors, reviewSchema } from "@/lib/validation";
import { accountsEnabled, getUser } from "@/server/auth";
import { clientIp, limit, tooMany } from "@/server/ratelimit";
import { submitReviewCore } from "@/server/reviews/core";
import { supabaseReviewStore } from "@/server/reviews/store";
import { verifyTurnstile } from "@/server/turnstile";
import type { FormState } from "./auth";

const str = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
};

/**
 * A new review. Saved as "pending" (an admin approves it before it shows).
 * Who wrote it and whether they bought it come from the session and the
 * database, never from the form.
 */
export async function submitReview(_prev: FormState, form: FormData): Promise<FormState> {
  const values = {
    productSlug: str(form, "productSlug"),
    rating: str(form, "rating"),
    authorName: str(form, "authorName").slice(0, 80),
    title: str(form, "title").slice(0, 150),
    body: str(form, "body").slice(0, 2100),
  };
  if (!accountsEnabled())
    return { status: "error", message: "Reviews aren't switched on here yet.", values };
  // field mistakes first, so a typo doesn't use up one of the 3 tries
  const parsed = reviewSchema.safeParse(values);
  if (!parsed.success)
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fields: fieldErrors(parsed.error),
      values,
    };

  const ip = await clientIp();
  const rl = await limit("review", ip);
  if (!rl.ok) return { status: "error", message: tooMany(rl), values };
  if (!(await verifyTurnstile(form.get("cf-turnstile-response"), ip)))
    return {
      status: "error",
      message: "We couldn't check you're human. Refresh the page and try again.",
      values,
    };

  const photos = form.getAll("photos").filter((f): f is File => f instanceof Blob);
  try {
    const user = await getUser();
    const result = await submitReviewCore(supabaseReviewStore(), values, photos, user?.id ?? null);
    if (result.status === "error")
      return { status: "error", message: result.message, fields: result.fields, values };
    return {
      status: "ok",
      message: result.verified
        ? `${result.message} It will carry a Verified buyer tag.`
        : result.message,
    };
  } catch (err) {
    console.error("[reviews] submit failed:", err instanceof Error ? err.message : err);
    return { status: "error", message: "Something went wrong. Please try again.", values };
  }
}
