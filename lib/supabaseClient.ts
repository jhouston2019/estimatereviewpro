import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "./supabase-types";

export function createSupabaseBrowserClient() {
  // Use typeof window to check if we're in browser environment
  const url = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_SUPABASE_URL 
    : process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = typeof window !== 'undefined'
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

  if (!url || !anonKey || url === 'https://placeholder.supabase.co') {
    if (typeof window !== 'undefined') {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY",
      );
    }
  }

  return createPagesBrowserClient<Database>({
    supabaseUrl: url,
    supabaseKey: anonKey,
  });
}

