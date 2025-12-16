import { cookies } from "next/headers";
import {
  createServerComponentClient,
  createRouteHandlerClient,
} from "@supabase/auth-helpers-nextjs";
import type { Database } from "./supabase-types";

export function createSupabaseServerComponentClient() {
  return createServerComponentClient<Database>({ cookies });
}

export function createSupabaseRouteHandlerClient() {
  return createRouteHandlerClient<Database>({ cookies });
}

