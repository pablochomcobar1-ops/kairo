import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs before the account, admin, checkout and login pages:
 *  1. refreshes the Supabase session cookie when it is about to expire,
 *  2. sends signed-out visitors from /account to /login (and back after),
 *  3. lets only admins into /admin (checked again on the server in Task 12),
 *  4. sends signed-in visitors away from /login and /signup.
 * Without Supabase settings (the GitHub checks) it does nothing.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          // same rules as src/server/supabase/server.ts (proxy code can't import server-only files)
          response.cookies.set(name, value, {
            ...options,
            httpOnly: true,
            secure:
              process.env.NODE_ENV === "production" &&
              !process.env.NEXT_PUBLIC_SITE_URL?.startsWith("http://"),
            sameSite: "lax",
            path: "/",
          });
        }
      },
    },
  });

  // getClaims verifies the token (and refreshes it if needed); never trust getSession() here
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  const path = request.nextUrl.pathname;

  const redirect = (to: string) => {
    const target = new URL(to, request.url);
    const res = NextResponse.redirect(target);
    // keep any refreshed session cookies
    for (const c of response.cookies.getAll()) res.cookies.set(c);
    return res;
  };

  if ((path === "/account" || path.startsWith("/account/")) && !userId) {
    return redirect(`/login?next=${encodeURIComponent(path + request.nextUrl.search)}`);
  }

  if (path === "/admin" || path.startsWith("/admin/")) {
    if (!userId) return redirect(`/login?next=${encodeURIComponent(path)}`);
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();
    if (profile?.role !== "admin") return redirect("/");
  }

  if ((path === "/login" || path === "/signup") && userId) {
    return redirect("/account");
  }

  return response;
}

export const config = {
  matcher: [
    "/account/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
    "/reset-password",
    "/checkout/:path*",
  ],
};
