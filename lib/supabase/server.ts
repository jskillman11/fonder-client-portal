import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Server-side client that respects the logged-in user's session -- used only
// to check "is someone logged in" (e.g. in middleware, or the admin pages).
export async function createServerAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
}

// Privileged client using the service role key -- bypasses RLS entirely.
// Only ever used in server-only code (API routes, server components) that
// need to read/write engagement data. NEVER import this in anything that
// ships to the browser -- SUPABASE_SERVICE_ROLE_KEY must stay server-only.
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// Shared check behind isAdminSession/getAdminUser: a logged-in Supabase user
// whose profiles row has role = 'staff'. Checking role rather than just "is
// there a session" is load-bearing now that clients also get real Supabase
// Auth accounts (see lib/portal-access.ts) -- any authenticated user without
// a staff profile row must NOT be treated as staff.
async function getStaffUser(): Promise<{ email: string } | null> {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "staff" ? { email: user.email } : null;
}

// Checks whether the current request has a logged-in Fonder staff session --
// used to let admins preview any client's portal directly, bypassing the
// magic-link gate that real clients go through.
export async function isAdminSession(): Promise<boolean> {
  return Boolean(await getStaffUser());
}

// Returns the logged-in Fonder admin's email, for display in the dashboard
// shell's account corner. Only meaningful under /admin, where middleware
// already guarantees a logged-in staff user.
export async function getAdminUser(): Promise<{ email: string } | null> {
  return getStaffUser();
}

// Backstop auth check for app/api/admin/* route handlers -- middleware.ts
// already covers this path, but a route handler is one grep away from being
// copy-pasted onto a path the matcher doesn't cover, so each route also
// checks for itself. Call at the top of every handler and return early if
// the result is a NextResponse.
export async function requireAdmin(): Promise<{ email: string } | NextResponse> {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

// Single gate for every client-portal route: staff can preview any client's
// portal (mirrors isAdminSession's old bypass), a client can only access the
// engagement their own profile.client_id is tied to.
export async function hasPortalAccess(
  clientSlug: string,
): Promise<{ authorized: boolean; isAdmin: boolean }> {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { authorized: false, isAdmin: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, client_id")
    .eq("id", user.id)
    .single();

  if (profile?.role === "staff") return { authorized: true, isAdmin: true };

  if (profile?.role === "client" && profile.client_id) {
    // Service-role read: an integrity check the app fully controls, so no
    // new client-facing RLS policy on `engagements` is needed.
    const service = createServiceClient();
    const { data: match } = await service
      .from("engagements")
      .select("id")
      .eq("client_slug", clientSlug)
      .eq("client_id", profile.client_id)
      .maybeSingle();
    return { authorized: Boolean(match), isAdmin: false };
  }

  return { authorized: false, isAdmin: false };
}
