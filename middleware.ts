import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Protects everything under /admin (pages) and /api/admin (route handlers) —
// requires a real, logged-in Supabase user. The public /portal/[client]
// routes are untouched by this and stay open, since that's what clients
// themselves need to access without any login.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiAdmin = pathname.startsWith("/api/admin");
  const isAdminPage = pathname.startsWith("/admin");

  if (!isApiAdmin && !isAdminPage) {
    return NextResponse.next();
  }
  if (pathname === "/admin/login") {
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
