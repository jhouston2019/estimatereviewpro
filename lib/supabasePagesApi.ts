import { createServerClient } from "@supabase/ssr";
import { parse, serialize, type SerializeOptions } from "cookie";
import type { NextApiRequest, NextApiResponse } from "next";
import type { Database } from "./supabase-types";

/**
 * Supabase client for Next.js Pages Router API routes (`pages/api/*`).
 * Uses @supabase/ssr with Request cookies / Set-Cookie (no auth-helpers).
 */
export function createSupabasePagesApiClient(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const raw = req.headers.cookie;
          if (!raw) return [];
          const parsed = parse(raw);
          return Object.entries(parsed).map(([name, value]) => ({
            name,
            value: value ?? "",
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.appendHeader(
              "Set-Cookie",
              serialize(
                name,
                value,
                (options ?? {}) as SerializeOptions
              )
            );
          });
        },
      },
    }
  );
}
