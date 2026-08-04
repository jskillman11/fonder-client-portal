import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Server-side client that respects the logged-in user's session -- used to
// check "is someone logged in" from admin pages, portal pages, and API
// routes alike.
export async function createServerAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll was called from a Server Component during render --
            // Next.js only allows cookie writes from a Server Action, Route
            // Handler, or Middleware. Safe to ignore here: this call is just
            // Supabase opportunistically persisting a refreshed session
            // token; without it, that read simply falls back to the
            // existing (possibly soon-to-expire) cookie, which the next
            // Route Handler/Server Action call will refresh instead. This
            // repo has no middleware.ts to refresh sessions proactively on
            // every request, so this path can be hit fairly routinely.
          }
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
async function getStaffUser(): Promise<{ id: string; email: string } | null> {
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

  return profile?.role === "staff" ? { id: user.id, email: user.email } : null;
}

// Checks whether the current request has a logged-in Fonder staff session --
// used to let admins preview any client's portal directly, bypassing the
// magic-link gate that real clients go through.
export async function isAdminSession(): Promise<boolean> {
  return Boolean(await getStaffUser());
}

// Returns the logged-in Fonder admin's id + email, for display in the
// dashboard shell's account corner and for self-action guards (e.g. "can't
// remove your own staff account"). Only meaningful under /admin, where
// middleware already guarantees a logged-in staff user.
export async function getAdminUser(): Promise<{ id: string; email: string } | null> {
  return getStaffUser();
}

// Backstop auth check for app/api/admin/* route handlers -- middleware.ts
// already covers this path, but a route handler is one grep away from being
// copy-pasted onto a path the matcher doesn't cover, so each route also
// checks for itself. Call at the top of every handler and return early if
// the result is a NextResponse.
export async function requireAdmin(): Promise<{ id: string; email: string } | NextResponse> {
  const user = await getAdminUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return user;
}

// A narrower tier on top of staff: only super-admins can invite, remove, or
// promote other staff accounts (see lib/staff.ts and app/admin/staff). Used
// both as a render-time guard (the /admin/staff page itself) and via
// requireSuperAdmin for the staff-management API routes.
export async function isSuperAdminSession(): Promise<boolean> {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_super_admin")
    .eq("id", user.id)
    .single();

  return profile?.role === "staff" && profile.is_super_admin === true;
}

export async function requireSuperAdmin(): Promise<{ id: string; email: string } | NextResponse> {
  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;
  if (!(await isSuperAdminSession())) {
    return NextResponse.json({ error: "Super-admin access required" }, { status: 403 });
  }
  return admin;
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
    // new client-facing RLS policy on `engagements` is needed. The portal
    // slug now lives on `companies`, so this resolves company-by-slug first,
    // then checks that profile.client_id is the stakeholder on that
    // company's currently active engagement.
    const service = createServiceClient();
    const { data: company } = await service
      .from("companies")
      .select("id")
      .eq("client_slug", clientSlug)
      .maybeSingle();
    if (!company) return { authorized: false, isAdmin: false };

    const { data: match } = await service
      .from("engagements")
      .select("id")
      .eq("company_id", company.id)
      .eq("client_id", profile.client_id)
      .eq("status", "active")
      .maybeSingle();
    return { authorized: Boolean(match), isAdmin: false };
  }

  return { authorized: false, isAdmin: false };
}
