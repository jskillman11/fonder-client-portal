import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

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
