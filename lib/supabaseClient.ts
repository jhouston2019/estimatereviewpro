import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database.types";

let browserSingleton: ReturnType<
  typeof createBrowserClient<Database>
> | null = null;

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }

  if (!browserSingleton) {
    browserSingleton = createBrowserClient<Database>(url, anonKey);
  }
  return browserSingleton;
}

/**
 * JSON API headers from the current browser session (call at fetch time).
 * Omits `Authorization` when there is no access token (does not send Bearer bypass).
 */
export async function getWizardAuthHeadersJson(): Promise<
  Record<string, string>
> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return headers;
  }
  const supabase = createSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/** `fetch` with wizard auth headers merged in at call time (via `getWizardAuthHeadersJson`). */
export async function wizardFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const base = await getWizardAuthHeadersJson();
  const merged = new Headers(base);
  if (init?.headers) {
    new Headers(init.headers).forEach((value, key) => {
      merged.set(key, value);
    });
  }
  return fetch(input, {
    ...init,
    headers: merged,
  });
}
