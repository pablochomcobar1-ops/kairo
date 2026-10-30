import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createServerClient } from "@/server/supabase/server";

/** True when Supabase settings exist (accounts work). False in the GitHub checks / fixtures previews. */
export function accountsEnabled(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  role: "customer" | "admin";
};

/**
 * The signed-in shopper, checked with Supabase (not just read from the cookie),
 * or null. Reads cookies, so call it inside <Suspense> on cached pages.
 */
export async function getUser(): Promise<SessionUser | null> {
  if (!accountsEnabled()) return null;
  // per-request: the session (and its expiry clock) must never be baked into a prerender
  await connection();
  const supabase = await createServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", data.user.id)
    .maybeSingle();
  return {
    id: data.user.id,
    email: data.user.email ?? "",
    fullName:
      profile?.full_name || (data.user.user_metadata?.full_name as string | undefined) || "",
    role: profile?.role === "admin" ? "admin" : "customer",
  };
}

/** For pages that need a signed-in shopper (the proxy already redirects; this is the second check). */
export async function requireUser(next = "/account"): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}
