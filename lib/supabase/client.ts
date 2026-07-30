import { createBrowserClient } from "@supabase/ssr";

// Used client-side only, for auth (login/logout). Never used to read/write
// engagement data directly -- that always goes through the server, using the
// service role key, so RLS + a stolen anon key can't expose client data.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
