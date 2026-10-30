import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/validation";
import { createServerClient } from "@/server/supabase/server";

/**
 * Where links from emails (confirm account, reset password) and Google
 * sign-in come back to. Swaps the one-time code for a session cookie, then
 * goes to `next`, which may only be a path on this site.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNextPath(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  const fail = () => NextResponse.redirect(new URL("/login?error=link", url.origin));

  try {
    const supabase = await createServerClient();
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return fail();
    } else if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (error) return fail();
    } else {
      return fail();
    }
  } catch {
    return fail();
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
