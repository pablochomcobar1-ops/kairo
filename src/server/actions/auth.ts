"use server";

import { redirect } from "next/navigation";
import { publicSiteUrl } from "@/lib/site-url";
import {
  fieldErrors,
  forgotSchema,
  loginSchema,
  profileSchema,
  resetSchema,
  safeNextPath,
  signupSchema,
} from "@/lib/validation";
import { accountsEnabled } from "@/server/auth";
import { clientIp, limit, tooMany } from "@/server/ratelimit";
import { createServerClient } from "@/server/supabase/server";
import { verifyTurnstile } from "@/server/turnstile";

export type FormState = {
  status: "idle" | "ok" | "error";
  message: string;
  fields?: Record<string, string>;
  /**
   * What was typed, sent back so the form can refill itself (React empties a
   * form after every submit). Passwords are never included.
   */
  values?: Record<string, string>;
};

/** The listed fields from a submitted form, for refilling it. */
const keep = async (form: FormData, keys: string[]) =>
  Object.fromEntries(
    keys.map((k) => [k, typeof form.get(k) === "string" ? String(form.get(k)).slice(0, 300) : ""]),
  );

const NOT_SET_UP: FormState = {
  status: "error",
  message: "Accounts aren't switched on here yet (Supabase settings are missing).",
};
const SOMETHING_WRONG: FormState = {
  status: "error",
  message: "Something went wrong. Please try again.",
};

const str = (form: FormData, key: string) => {
  const v = form.get(key);
  return typeof v === "string" ? v : "";
};

/** Same message whether the email is new or already registered: nobody can probe who has an account. */
export async function signUp(_prev: FormState, form: FormData): Promise<FormState> {
  if (!accountsEnabled()) return NOT_SET_UP;
  const parsed = signupSchema.safeParse({
    fullName: str(form, "fullName"),
    email: str(form, "email"),
    password: str(form, "password"),
  });
  if (!parsed.success)
    return {
      values: await keep(form, ["fullName", "email"]),
      status: "error",
      message: "Check the highlighted fields.",
      fields: fieldErrors(parsed.error),
    };

  const ip = await clientIp();
  const rl = await limit("auth", ip);
  if (!rl.ok)
    return {
      values: await keep(form, ["fullName", "email"]),
      status: "error",
      message: tooMany(rl),
    };
  if (!(await verifyTurnstile(form.get("cf-turnstile-response"), ip))) {
    return {
      values: await keep(form, ["fullName", "email"]),
      status: "error",
      message: "We couldn't check you're human. Refresh the page and try again.",
    };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${publicSiteUrl()}/auth/callback?next=/account`,
    },
  });
  if (error) {
    if (error.code === "weak_password")
      return {
        values: await keep(form, ["fullName", "email"]),
        status: "error",
        message: "Choose a stronger password.",
        fields: { password: error.message },
      };
    if (error.code === "over_email_send_rate_limit")
      return {
        values: await keep(form, ["fullName", "email"]),
        status: "error",
        message: "Too many emails sent just now. Try again in an hour.",
      };
    if (error.code !== "user_already_exists" && error.code !== "email_exists") {
      console.error("[auth] signUp:", error.code, error.message);
      return { ...SOMETHING_WRONG, values: await keep(form, ["fullName", "email"]) };
    }
  }
  return {
    status: "ok",
    message: `Check ${parsed.data.email} for a link to confirm your account.`,
  };
}

export async function signIn(_prev: FormState, form: FormData): Promise<FormState> {
  if (!accountsEnabled()) return NOT_SET_UP;
  const parsed = loginSchema.safeParse({
    email: str(form, "email"),
    password: str(form, "password"),
  });
  if (!parsed.success)
    return {
      values: await keep(form, ["email"]),
      status: "error",
      message: "Check the highlighted fields.",
      fields: fieldErrors(parsed.error),
    };

  const rl = await limit("auth", await clientIp());
  if (!rl.ok) return { values: await keep(form, ["email"]), status: "error", message: tooMany(rl) };

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return {
        values: await keep(form, ["email"]),
        status: "error",
        message: "Confirm your email first: open the link we sent when you signed up.",
      };
    }
    // one message for "no such account" and "wrong password"
    return {
      values: await keep(form, ["email"]),
      status: "error",
      message: "That email and password don't match.",
    };
  }
  redirect(safeNextPath(str(form, "next")));
}

export async function signInWithGoogle(_prev: FormState, form: FormData): Promise<FormState> {
  if (!accountsEnabled()) return NOT_SET_UP;
  const next = safeNextPath(str(form, "next"));
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${publicSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) {
    console.error("[auth] google:", error?.message);
    return { status: "error", message: "Google sign-in isn't available right now." };
  }
  redirect(data.url);
}

export async function requestPasswordReset(_prev: FormState, form: FormData): Promise<FormState> {
  if (!accountsEnabled()) return NOT_SET_UP;
  const parsed = forgotSchema.safeParse({ email: str(form, "email") });
  if (!parsed.success)
    return {
      values: await keep(form, ["email"]),
      status: "error",
      message: "Check the highlighted fields.",
      fields: fieldErrors(parsed.error),
    };

  const rl = await limit("auth", await clientIp());
  if (!rl.ok) return { values: await keep(form, ["email"]), status: "error", message: tooMany(rl) };

  const supabase = await createServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicSiteUrl()}/auth/callback?next=/reset-password`,
  });
  if (error && error.code === "over_email_send_rate_limit") {
    return {
      values: await keep(form, ["email"]),
      status: "error",
      message: "Too many emails sent just now. Try again in an hour.",
    };
  }
  if (error) console.error("[auth] reset:", error.code, error.message);
  // same answer whether or not the account exists
  return {
    status: "ok",
    message: `If ${parsed.data.email} has an account, a reset link is on its way.`,
  };
}

/** Runs after the reset link signed the visitor in for this one purpose. */
export async function updatePassword(_prev: FormState, form: FormData): Promise<FormState> {
  if (!accountsEnabled()) return NOT_SET_UP;
  const parsed = resetSchema.safeParse({
    password: str(form, "password"),
    confirm: str(form, "confirm"),
  });
  if (!parsed.success)
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fields: fieldErrors(parsed.error),
    };

  const supabase = await createServerClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user)
    return { status: "error", message: "This reset link has expired. Ask for a new one." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password")
      return {
        status: "error",
        message: "Choose a password you haven't used here before.",
        fields: { password: "Same as your old password." },
      };
    console.error("[auth] update password:", error.code, error.message);
    return SOMETHING_WRONG;
  }
  redirect("/account?updated=password");
}

export async function signOut(): Promise<void> {
  if (accountsEnabled()) {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function updateProfile(_prev: FormState, form: FormData): Promise<FormState> {
  if (!accountsEnabled()) return NOT_SET_UP;
  const parsed = profileSchema.safeParse({
    fullName: str(form, "fullName"),
    phone: str(form, "phone"),
  });
  if (!parsed.success)
    return {
      values: await keep(form, ["fullName", "phone"]),
      status: "error",
      message: "Check the highlighted fields.",
      fields: fieldErrors(parsed.error),
    };

  const supabase = await createServerClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user)
    return {
      values: await keep(form, ["fullName", "phone"]),
      status: "error",
      message: "Please sign in again.",
    };

  // RLS only lets people update their own row, and only these two columns
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName, phone: parsed.data.phone })
    .eq("id", user.user.id);
  if (error) {
    console.error("[auth] profile:", error.message);
    return { ...SOMETHING_WRONG, values: await keep(form, ["fullName", "phone"]) };
  }
  return { status: "ok", message: "Saved." };
}
