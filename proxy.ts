import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Protects everything under /admin (pages) and /api/admin (route handlers) —
// requires a real, logged-in Supabase user with a staff profile. Also runs
// for /portal/[client] so client (magic-link) sessions get the same
// treatment below; those routes stay open to anyone, auth is enforced by
// hasPortalAccess further down the stack, not here.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiAdmin = pathname.startsWith("/api/admin");
  const isAdminPage = pathname.startsWith("/admin");

  if (pathname === "/admin/login" || pathname.startsWith("/admin/invite/")) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the session (and rewrites the cookie) on every matched
  // request. Server Components can't persist a refreshed cookie themselves
  // (see lib/supabase/server.ts) -- without this, a session silently dies
  // once its access token expires instead of transparently refreshing,
  // which is what was forcing clients (and staff) to re-verify/log in again
  // on their next visit.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isApiAdmin && !isAdminPage) {
    return response;
  }

  // Beyond "is there a session": clients also get real Supabase Auth
  // accounts (see lib/portal-access.ts), so admin access requires an actual
  // staff profiles row, not just any logged-in user.
  const isStaff = user
    ? (
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()
      ).data?.role === "staff"
    : false;

  if (!isStaff) {
    if (isApiAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/portal/:path*"],
};
