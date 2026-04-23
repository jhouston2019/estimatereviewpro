import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./supabase-types";

/**
 * Next.js 15+: `cookies()` returns a Promise — await before read/write.
 * Uses @supabase/ssr instead of auth-helpers' sync `cookies()` bridge.
 */
async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // e.g. Server Components — session refresh can occur in Route Handlers
          }
        },
      },
    }
  );
}

export async function createSupabaseServerComponentClient() {
  return createSupabaseServerClient();
}

export async function createSupabaseRouteHandlerClient() {
  return createSupabaseServerClient();
}
