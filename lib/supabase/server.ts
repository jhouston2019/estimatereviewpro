"use server";

import { cookies } from "next/headers";
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

/**
 * Typed Supabase client for server components.
 * MUST be async because Next.js treats any exported function in a `"use server"` file as a server action.
 */
export async function createServerClient(cookieStore = cookies()) {
  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}
